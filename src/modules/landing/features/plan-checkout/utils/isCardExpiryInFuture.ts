import {
  CARD_EXPIRY,
  CHECKOUT_FIELD_PATTERN,
} from "../constants/PlanCheckout.constants";

const readMonthIndex = (year: number, month: number): number =>
  year * CARD_EXPIRY.MONTHS_PER_YEAR + month;

// A card works until the end of its expiry month, like the server check in
// api/callFunction.ts (isCardExpiryInFuture).
export const isCardExpiryInFuture = (
  cardExpiry: string,
  today: Date = new Date(),
): boolean => {
  const expiryMatch = CHECKOUT_FIELD_PATTERN.CARD_EXPIRY.exec(cardExpiry);
  if (!expiryMatch) return false;
  const expiryMonth = Number(expiryMatch[CARD_EXPIRY.MONTH_GROUP_INDEX]);
  const expiryYear =
    CARD_EXPIRY.CENTURY_START_YEAR +
    Number(expiryMatch[CARD_EXPIRY.YEAR_GROUP_INDEX]);
  return (
    readMonthIndex(expiryYear, expiryMonth) >=
    readMonthIndex(today.getUTCFullYear(), today.getUTCMonth() + 1)
  );
};
