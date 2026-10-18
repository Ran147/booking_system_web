import type { ServiceDiscount } from "@/domain";
import {
  DISCOUNT_STATUS,
  DISCOUNT_TYPE,
  TIME_CALCULATION,
  type DiscountStatus,
} from "../constants/ServiceDiscount.constants";

const FIRST_ELEMENT_INDEX = 0;
const SECOND_ELEMENT_INDEX = 1;
const THIRD_ELEMENT_INDEX = 2;

export const calculateDiscountedPrice = (
  priceInCents: number,
  discount: ServiceDiscount,
): number => {
  const basePriceInCents = Math.max(0, priceInCents);

  if (discount.type === DISCOUNT_TYPE.PERCENTAGE) {
    const clampedPercentage = Math.min(
      TIME_CALCULATION.PERCENTAGE_BASE,
      Math.max(0, discount.value),
    );
    const deductionInCents = Math.round(
      (basePriceInCents * clampedPercentage) / TIME_CALCULATION.PERCENTAGE_BASE,
    );
    return Math.max(0, basePriceInCents - deductionInCents);
  }

  const clampedAmount = Math.max(0, discount.value);
  return Math.max(0, basePriceInCents - clampedAmount);
};

export const getCalendarDayUtcMidnight = (
  dateInput: Date | string,
  timeZone: string = "UTC",
): number => {
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [yearString, monthString, dayString] = dateInput.split("-");
    return Date.UTC(
      Number(yearString),
      Number(monthString) - 1,
      Number(dayString),
    );
  }

  const parsedDate =
    typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(parsedDate.getTime())) {
    return Number.NaN;
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    });
    const [year, month, day] = formatter
      .format(parsedDate)
      .split("-")
      .map(Number);
    return Date.UTC(
      year ?? FIRST_ELEMENT_INDEX,
      (month ?? SECOND_ELEMENT_INDEX) - 1,
      day ?? THIRD_ELEMENT_INDEX,
    );
  } catch {
    return Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate(),
    );
  }
};

export const hasDateRangeOverlap = (
  existingDiscounts: readonly ServiceDiscount[],
  candidateRange: {
    readonly endsAt: Date | string;
    readonly startsAt: Date | string;
  },
  ignoredIndex?: number,
  timeZone: string = "UTC",
): boolean => {
  const candidateStartTime = getCalendarDayUtcMidnight(
    candidateRange.startsAt,
    timeZone,
  );
  const candidateEndTime = getCalendarDayUtcMidnight(
    candidateRange.endsAt,
    timeZone,
  );

  return existingDiscounts.some((existingDiscount, discountIndex) => {
    if (ignoredIndex !== undefined && discountIndex === ignoredIndex) {
      return false;
    }

    const existingStartTime = getCalendarDayUtcMidnight(
      existingDiscount.startsAt,
      timeZone,
    );
    const existingEndTime = getCalendarDayUtcMidnight(
      existingDiscount.endsAt,
      timeZone,
    );

    return (
      candidateStartTime <= existingEndTime &&
      candidateEndTime >= existingStartTime
    );
  });
};

export const getDiscountStatus = (
  discount: ServiceDiscount,
  currentDate: Date = new Date(),
  timeZone: string = "UTC",
): DiscountStatus => {
  const currentTimestamp = getCalendarDayUtcMidnight(currentDate, timeZone);
  const startOfDayTimestamp = getCalendarDayUtcMidnight(
    discount.startsAt,
    timeZone,
  );
  const endOfDayTimestamp = getCalendarDayUtcMidnight(
    discount.endsAt,
    timeZone,
  );

  if (currentTimestamp > endOfDayTimestamp) {
    return DISCOUNT_STATUS.EXPIRED;
  }

  if (currentTimestamp < startOfDayTimestamp) {
    return DISCOUNT_STATUS.UPCOMING;
  }

  return DISCOUNT_STATUS.ACTIVE;
};
