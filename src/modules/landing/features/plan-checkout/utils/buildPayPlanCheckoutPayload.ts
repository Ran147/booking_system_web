import { DEFAULT_LANGUAGE, LANGUAGE, type Language } from "@/constants";
import type { PayPlanCheckoutPayload } from "../models/PayPlanCheckout.mutation";
import type { PlanCheckoutFormValues } from "../models/PlanCheckout.model";

export interface PlanCheckoutAttempt {
  /** Active landing language; anything unsupported becomes the default. */
  readonly activeLanguage: string;
  /** One per visit to the checkout (AC-KAN-22-09). */
  readonly attemptId: string;
  /** The price on screen (AC-KAN-22-08). */
  readonly expectedPriceInCents: number;
  readonly planId: string;
  /** Token of the solved reCAPTCHA (AC-KAN-22-06). */
  readonly recaptchaToken: string;
}

const toSupportedLanguage = (activeLanguage: string): Language =>
  Object.values(LANGUAGE).find((language) => language === activeLanguage) ??
  DEFAULT_LANGUAGE;

export const buildPayPlanCheckoutPayload = (
  formValues: PlanCheckoutFormValues,
  {
    activeLanguage,
    attemptId,
    expectedPriceInCents,
    planId,
    recaptchaToken,
  }: PlanCheckoutAttempt,
): PayPlanCheckoutPayload => ({
  attemptId,
  cardCvc: formValues.cardCvc,
  cardExpiry: formValues.cardExpiry,
  cardNumber: formValues.cardNumber,
  cardholderName: formValues.cardholderName,
  email: formValues.email,
  expectedPriceInCents,
  language: toSupportedLanguage(activeLanguage),
  planId,
  recaptchaToken,
  termsAccepted: formValues.termsAccepted,
});
