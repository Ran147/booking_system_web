import type { Language } from "@/constants";

/**
 * Payload of payPlanCheckout (api/callFunction.ts). The card fields go to the
 * simulated gateway only; the server never stores them (AS-9).
 * @property attemptId - One UUID per visit to the checkout: a retry of the
 *   same attempt is never charged twice (AC-KAN-22-09).
 * @property expectedPriceInCents - The price the visitor saw (AC-KAN-22-08).
 * @property language - Language of the checkout, used for the KAN-24 email.
 * @property recaptchaToken - Token of the solved reCAPTCHA (AC-KAN-22-06).
 */
export interface PayPlanCheckoutPayload {
  readonly attemptId: string;
  readonly cardCvc: string;
  readonly cardExpiry: string;
  readonly cardNumber: string;
  readonly cardholderName: string;
  readonly email: string;
  readonly expectedPriceInCents: number;
  readonly language: Language;
  readonly planId: string;
  readonly recaptchaToken: string;
  readonly termsAccepted: boolean;
}

/**
 * @property email - The checkout email as stored: trimmed and in lower case
 *   (AC-KAN-22-11).
 */
export interface PayPlanCheckoutResponse {
  readonly email: string;
}
