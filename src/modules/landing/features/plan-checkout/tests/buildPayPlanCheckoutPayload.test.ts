import { DEFAULT_LANGUAGE, LANGUAGE } from "@/constants";
import type { PlanCheckoutFormValues } from "../models/PlanCheckout.model";
import { buildPayPlanCheckoutPayload } from "../utils/buildPayPlanCheckoutPayload";

const FORM_VALUES: PlanCheckoutFormValues = {
  cardCvc: "123",
  cardExpiry: "12/40",
  cardNumber: "4000 0000 0000 0001",
  cardholderName: "Ana Pérez",
  email: "duena@negocio.com",
  termsAccepted: true,
};

const ATTEMPT = {
  attemptId: "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b",
  expectedPriceInCents: 29_900,
  planId: "plan-basic",
  recaptchaToken: "recaptcha-token",
};

describe("buildPayPlanCheckoutPayload (KAN-22)", () => {
  it("KAN-22: AC-KAN-22-02 joins the form values and the attempt", () => {
    expect(
      buildPayPlanCheckoutPayload(FORM_VALUES, {
        ...ATTEMPT,
        activeLanguage: LANGUAGE.EN,
      }),
    ).toEqual({ ...FORM_VALUES, ...ATTEMPT, language: LANGUAGE.EN });
  });

  it("KAN-22: an unsupported language becomes the default one", () => {
    expect(
      buildPayPlanCheckoutPayload(FORM_VALUES, {
        ...ATTEMPT,
        activeLanguage: "fr",
      }).language,
    ).toBe(DEFAULT_LANGUAGE);
  });
});
