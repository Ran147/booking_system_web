import { z } from "zod";
import { LANGUAGE } from "../../shared/constants/Language.constants.js";
import { STRING } from "../../shared/constants/String.constants.js";
import {
  CARD_EXPIRY,
  PLAN_CHECKOUT_FIELD_LIMIT,
  PLAN_CHECKOUT_PATTERN,
} from "../constants/PlanCheckout.constants.js";

// The same field rules as the checkout form, checked again on the server
// (cloud-functions-standards §3).

const readMonthIndex = (year: number, month: number): number =>
  year * CARD_EXPIRY.MONTHS_PER_YEAR + month;

// "MM/AA" is still valid during its own month.
const isCardExpiryInFuture = (cardExpiry: string): boolean => {
  const expiryMatch = PLAN_CHECKOUT_PATTERN.CARD_EXPIRY.exec(cardExpiry);
  if (!expiryMatch) return false;
  const expiryMonth = Number(expiryMatch[CARD_EXPIRY.MONTH_GROUP_INDEX]);
  const expiryYear =
    CARD_EXPIRY.CENTURY_START_YEAR +
    Number(expiryMatch[CARD_EXPIRY.YEAR_GROUP_INDEX]);
  const today = new Date();
  return (
    readMonthIndex(expiryYear, expiryMonth) >=
    readMonthIndex(today.getUTCFullYear(), today.getUTCMonth() + 1)
  );
};

// Stored trimmed and in lower case: it becomes the account email (AC-KAN-22-11).
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(PLAN_CHECKOUT_FIELD_LIMIT.EMAIL_MAX_LENGTH)
  .pipe(z.email());

// The form may group the digits with spaces.
const cardNumberSchema = z
  .string()
  .transform((cardNumber) =>
    cardNumber.replace(PLAN_CHECKOUT_PATTERN.WHITESPACE, STRING.EMPTY),
  )
  .pipe(z.string().regex(PLAN_CHECKOUT_PATTERN.CARD_NUMBER));

// The fields of plans/{planId} that the payment reads. A plan that does not
// match is treated as unavailable, never as a changed price.
export const payablePlanDocumentSchema = z.object({
  priceInCents: z.number().int().nonnegative(),
  status: z.string(),
});

export type PayablePlanDocument = z.infer<typeof payablePlanDocumentSchema>;

export const payPlanCheckoutPayloadSchema = z.object({
  attemptId: z.uuid(),
  cardCvc: z.string().trim().regex(PLAN_CHECKOUT_PATTERN.CARD_CVC),
  cardExpiry: z.string().trim().refine(isCardExpiryInFuture),
  cardNumber: cardNumberSchema,
  cardholderName: z
    .string()
    .trim()
    .min(PLAN_CHECKOUT_FIELD_LIMIT.CARDHOLDER_NAME_MIN_LENGTH)
    .max(PLAN_CHECKOUT_FIELD_LIMIT.CARDHOLDER_NAME_MAX_LENGTH),
  email: emailSchema,
  expectedPriceInCents: z.number().int().nonnegative(),
  language: z.enum(Object.values(LANGUAGE)),
  planId: z.string().trim().min(1),
  recaptchaToken: z.string().min(1),
  // A payment without accepted terms is rejected (AC-KAN-23-03).
  termsAccepted: z.literal(true),
});
