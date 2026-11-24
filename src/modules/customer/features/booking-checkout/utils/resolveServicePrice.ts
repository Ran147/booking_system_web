import type { NullableUndefined } from "@/types";
import {
  DISCOUNT_TYPE,
  PERCENTAGE_BASE,
} from "../constants/BookingCheckout.constants";

// en-CA formats a date as YYYY-MM-DD, which compares in calendar order.
const ISO_DATE_LOCALE = "en-CA";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface DiscountItem {
  readonly endsAt?: unknown;
  readonly startsAt?: unknown;
  readonly type?: unknown;
  readonly value?: unknown;
}

const formatDay = (instant: Date, timeZone: string): string =>
  new Intl.DateTimeFormat(ISO_DATE_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).format(instant);

// A discount bound: Firestore Timestamp, Date, YYYY-MM-DD, ISO string or ms.
const readDay = (
  value: unknown,
  timeZone: string,
): NullableUndefined<string> => {
  if (typeof value === "string" && ISO_DATE_PATTERN.test(value)) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return formatDay((value as { toDate: () => Date }).toDate(), timeZone);
  }
  const instant =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : undefined;
  return instant && !Number.isNaN(instant.getTime())
    ? formatDay(instant, timeZone)
    : undefined;
};

/**
 * The price the server will store for the service today (AC-KAN-146-06).
 * Mirror of the price rule of buildServiceSnapshot in
 * functions/src/bookings/utils/buildServiceSnapshot.ts — keep in sync: the
 * first discount whose calendar days (in the business time zone) include
 * today applies; a percentage is capped at 100 and the price never goes
 * below 0.
 */
export const resolveServicePrice = (
  priceInCents: number,
  discounts: unknown,
  timeZone: string,
  now: Date,
): number => {
  const basePrice = Math.max(0, priceInCents);
  if (!Array.isArray(discounts)) return basePrice;

  const today = formatDay(now, timeZone);
  const activeDiscount = discounts.find((item: unknown) => {
    if (typeof item !== "object" || item === null) return false;
    const { endsAt, startsAt } = item as DiscountItem;
    const startDay = readDay(startsAt, timeZone);
    const endDay = readDay(endsAt, timeZone);
    return Boolean(startDay && endDay && today >= startDay && today <= endDay);
  }) as NullableUndefined<DiscountItem>;
  if (!activeDiscount) return basePrice;

  const value = Math.max(0, Number(activeDiscount.value ?? 0));
  if (activeDiscount.type === DISCOUNT_TYPE.PERCENTAGE) {
    const percentage = Math.min(PERCENTAGE_BASE, value);
    return Math.max(
      0,
      basePrice - Math.round((basePrice * percentage) / PERCENTAGE_BASE),
    );
  }
  if (activeDiscount.type === DISCOUNT_TYPE.FIXED_AMOUNT) {
    return Math.max(0, basePrice - value);
  }
  return basePrice;
};
