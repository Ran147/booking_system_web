import { z } from "zod";
import { STRING, VALIDATION_MESSAGE_KEY } from "@/constants";
import {
  CHECKOUT_FIELD_LIMIT,
  CHECKOUT_FIELD_PATTERN,
  PLAN_CHECKOUT_MESSAGE_KEY,
} from "../constants/PlanCheckout.constants";
import { isCardExpiryInFuture } from "../utils/isCardExpiryInFuture";

const removeWhitespace = (value: string): string =>
  value.replace(CHECKOUT_FIELD_PATTERN.WHITESPACE, STRING.EMPTY);

// Each message is an i18n key the ViewModel translates (AC-KAN-22-05). The
// rules are the server's, so a value the form accepts is never rejected as
// invalid-argument.
export const checkoutSchema = z.object({
  cardCvc: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .regex(
      CHECKOUT_FIELD_PATTERN.CARD_CVC,
      PLAN_CHECKOUT_MESSAGE_KEY.CARD_INVALID,
    ),
  cardExpiry: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .refine(isCardExpiryInFuture, PLAN_CHECKOUT_MESSAGE_KEY.CARD_INVALID),
  // The digits may be grouped with spaces; the server removes them too.
  cardNumber: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .refine(
      (cardNumber) =>
        CHECKOUT_FIELD_PATTERN.CARD_NUMBER.test(removeWhitespace(cardNumber)),
      PLAN_CHECKOUT_MESSAGE_KEY.CARD_INVALID,
    ),
  cardholderName: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .min(
      CHECKOUT_FIELD_LIMIT.CARDHOLDER_NAME_MIN_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_SHORT,
    )
    .max(
      CHECKOUT_FIELD_LIMIT.CARDHOLDER_NAME_MAX_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ),
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .max(CHECKOUT_FIELD_LIMIT.EMAIL_MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG)
    .pipe(z.email(VALIDATION_MESSAGE_KEY.EMAIL_INVALID)),
  termsAccepted: z.boolean().refine((termsAccepted) => termsAccepted, {
    message: PLAN_CHECKOUT_MESSAGE_KEY.TERMS_REQUIRED,
  }),
});

export type PlanCheckoutFormValues = z.infer<typeof checkoutSchema>;

export const PLAN_CHECKOUT_STATE = Object.freeze({
  NOT_FOUND: "notFound",
  PROCESSING: "processing",
  READY: "ready",
  SUCCESS: "success",
} as const);

export type PlanCheckoutState =
  (typeof PLAN_CHECKOUT_STATE)[keyof typeof PLAN_CHECKOUT_STATE];
