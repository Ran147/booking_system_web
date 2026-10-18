export const DISCOUNT_LIMIT = Object.freeze({
  MAX_PERCENTAGE: 100,
  MIN_FIXED_AMOUNT_CENTS: 1,
  MIN_PERCENTAGE: 1,
});

export const DISCOUNT_STATUS = Object.freeze({
  ACTIVE: "active",
  EXPIRED: "expired",
  UPCOMING: "upcoming",
});

export type DiscountStatus =
  (typeof DISCOUNT_STATUS)[keyof typeof DISCOUNT_STATUS];

export const DISCOUNT_TYPE = Object.freeze({
  FIXED_AMOUNT: "fixed_amount",
  PERCENTAGE: "percentage",
});

export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];

export const TIME_CALCULATION = Object.freeze({
  END_OF_DAY_HOUR: 23,
  END_OF_DAY_MILLISECOND: 999,
  END_OF_DAY_MINUTE: 59,
  END_OF_DAY_SECOND: 59,
  PERCENTAGE_BASE: 100,
});
