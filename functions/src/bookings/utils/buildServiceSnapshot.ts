import {
  DISCOUNT_TYPE,
  TIME_CONVERSION,
} from "../../shared/constants/ServiceDiscount.constants.js";
import type { Nullable } from "../../shared/types/Nullable.js";
import type { ServiceSnapshot } from "../models/CreateBooking.mutation.js";

const FIRST_ELEMENT_INDEX = 0;
const SECOND_ELEMENT_INDEX = 1;
const THIRD_ELEMENT_INDEX = 2;

export interface BuildServiceSnapshotOptions {
  readonly currentDate?: Date;
  readonly serviceData: {
    readonly discounts?: unknown;
    readonly durationMinutes?: unknown;
    readonly name?: unknown;
    readonly priceInCents?: unknown;
  };
  readonly timeZone?: string;
}

const parseDateValue = (value: unknown): Nullable<Date | string> => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  return null;
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

export const buildServiceSnapshot = (
  options: BuildServiceSnapshotOptions,
): ServiceSnapshot => {
  const { currentDate = new Date(), serviceData, timeZone = "UTC" } = options;

  let finalPriceInCents = Math.max(0, Number(serviceData.priceInCents ?? 0));
  const rawDiscounts = Array.isArray(serviceData.discounts)
    ? serviceData.discounts
    : [];

  const currentDayMidnight = getCalendarDayUtcMidnight(currentDate, timeZone);

  for (const discountItem of rawDiscounts) {
    if (!discountItem || typeof discountItem !== "object") {
      continue;
    }

    const discount = discountItem as {
      readonly endsAt: unknown;
      readonly startsAt: unknown;
      readonly type: unknown;
      readonly value: unknown;
    };

    const startDateValue = parseDateValue(discount.startsAt);
    const endDateValue = parseDateValue(discount.endsAt);

    if (!startDateValue || !endDateValue) {
      continue;
    }

    const startDayMidnight = getCalendarDayUtcMidnight(
      startDateValue,
      timeZone,
    );
    const endDayMidnight = getCalendarDayUtcMidnight(endDateValue, timeZone);

    if (
      currentDayMidnight >= startDayMidnight &&
      currentDayMidnight <= endDayMidnight
    ) {
      const numericValue = Math.max(0, Number(discount.value ?? 0));

      if (discount.type === DISCOUNT_TYPE.PERCENTAGE) {
        const clampedPercentage = Math.min(
          TIME_CONVERSION.PERCENTAGE_BASE,
          numericValue,
        );
        const deductionInCents = Math.round(
          (finalPriceInCents * clampedPercentage) /
            TIME_CONVERSION.PERCENTAGE_BASE,
        );
        finalPriceInCents = Math.max(0, finalPriceInCents - deductionInCents);
      } else if (discount.type === DISCOUNT_TYPE.FIXED_AMOUNT) {
        finalPriceInCents = Math.max(0, finalPriceInCents - numericValue);
      }

      break;
    }
  }

  return {
    durationMinutes: Number(serviceData.durationMinutes ?? 0),
    name: String(serviceData.name ?? ""),
    priceInCents: finalPriceInCents,
  };
};
