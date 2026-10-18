import type { ServiceDiscount } from "@/domain";
import {
  DISCOUNT_STATUS,
  DISCOUNT_TYPE,
  TIME_CALCULATION,
  type DiscountStatus,
} from "../constants/ServiceDiscount.constants";

export const calculateDiscountedPrice = (
  priceInCents: number,
  discount: ServiceDiscount,
): number => {
  if (discount.type === DISCOUNT_TYPE.PERCENTAGE) {
    const deductionInCents = Math.round(
      (priceInCents * discount.value) / TIME_CALCULATION.PERCENTAGE_BASE,
    );
    return Math.max(0, priceInCents - deductionInCents);
  }

  return Math.max(0, priceInCents - discount.value);
};

export const hasDateRangeOverlap = (
  existingDiscounts: readonly ServiceDiscount[],
  candidateRange: { readonly endsAt: Date; readonly startsAt: Date },
  ignoredIndex?: number,
): boolean => {
  const candidateStartTime = new Date(candidateRange.startsAt).setHours(
    0,
    0,
    0,
    0,
  );
  const candidateEndTime = new Date(candidateRange.endsAt).setHours(
    TIME_CALCULATION.END_OF_DAY_HOUR,
    TIME_CALCULATION.END_OF_DAY_MINUTE,
    TIME_CALCULATION.END_OF_DAY_SECOND,
    TIME_CALCULATION.END_OF_DAY_MILLISECOND,
  );

  return existingDiscounts.some((existingDiscount, discountIndex) => {
    if (ignoredIndex !== undefined && discountIndex === ignoredIndex) {
      return false;
    }

    const existingStartTime = new Date(existingDiscount.startsAt).setHours(
      0,
      0,
      0,
      0,
    );
    const existingEndTime = new Date(existingDiscount.endsAt).setHours(
      TIME_CALCULATION.END_OF_DAY_HOUR,
      TIME_CALCULATION.END_OF_DAY_MINUTE,
      TIME_CALCULATION.END_OF_DAY_SECOND,
      TIME_CALCULATION.END_OF_DAY_MILLISECOND,
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
): DiscountStatus => {
  const currentTimestamp = currentDate.getTime();
  const startOfDayTimestamp = new Date(discount.startsAt).setHours(0, 0, 0, 0);
  const endOfDayTimestamp = new Date(discount.endsAt).setHours(
    TIME_CALCULATION.END_OF_DAY_HOUR,
    TIME_CALCULATION.END_OF_DAY_MINUTE,
    TIME_CALCULATION.END_OF_DAY_SECOND,
    TIME_CALCULATION.END_OF_DAY_MILLISECOND,
  );

  if (currentTimestamp > endOfDayTimestamp) {
    return DISCOUNT_STATUS.EXPIRED;
  }

  if (currentTimestamp < startOfDayTimestamp) {
    return DISCOUNT_STATUS.UPCOMING;
  }

  return DISCOUNT_STATUS.ACTIVE;
};
