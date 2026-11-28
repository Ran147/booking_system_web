import { VALIDATION_MESSAGE_KEY } from "@/constants";
import type { NullableUndefined } from "@/types";
import { PLAN_CHECKOUT_MESSAGE_KEY } from "../constants/PlanCheckout.constants";
import {
  checkoutSchema,
  type PlanCheckoutFormValues,
} from "../models/PlanCheckout.model";
import { isCardExpiryInFuture } from "../utils/isCardExpiryInFuture";

const VALID_VALUES: PlanCheckoutFormValues = {
  cardCvc: "123",
  cardExpiry: "12/40",
  cardNumber: "4000 0000 0000 0001",
  cardholderName: "Ana Pérez",
  email: "duena@negocio.com",
  termsAccepted: true,
};

const readFieldMessage = (
  overrides: Partial<PlanCheckoutFormValues>,
): NullableUndefined<string> =>
  checkoutSchema.safeParse({ ...VALID_VALUES, ...overrides }).error?.issues[0]
    ?.message;

// The form follows the payPlanCheckout rules of api/callFunction.ts, so the
// server never answers invalid-argument to a value the form accepted.
describe("checkoutSchema (KAN-22)", () => {
  it("KAN-22: AC-KAN-22-05 accepts valid values, with the card digits grouped by spaces", () => {
    expect(checkoutSchema.safeParse(VALID_VALUES).success).toBe(true);
  });

  it.each([
    ["an expiry without the slash", { cardExpiry: "1240" }],
    ["an expired card", { cardExpiry: "01/20" }],
    ["a CVC with letters", { cardCvc: "12a" }],
    ["a card number with 15 digits", { cardNumber: "400000000000001" }],
  ])(
    "KAN-22: AC-KAN-22-05 rejects %s as an invalid card",
    (_case, overrides) => {
      expect(readFieldMessage(overrides)).toBe(
        PLAN_CHECKOUT_MESSAGE_KEY.CARD_INVALID,
      );
    },
  );

  it("KAN-22: AC-KAN-22-05 rejects a cardholder name longer than 60 characters", () => {
    expect(readFieldMessage({ cardholderName: "a".repeat(61) })).toBe(
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    );
  });

  it("KAN-22: AC-KAN-22-05 asks for the empty fields and a valid email", () => {
    expect(readFieldMessage({ cardNumber: "" })).toBe(
      VALIDATION_MESSAGE_KEY.REQUIRED,
    );
    expect(readFieldMessage({ email: "no-es-un-correo" })).toBe(
      VALIDATION_MESSAGE_KEY.EMAIL_INVALID,
    );
  });

  it("KAN-22: the card still works during its expiry month", () => {
    const today = new Date(Date.UTC(2026, 10, 15));

    expect(isCardExpiryInFuture("11/26", today)).toBe(true);
    expect(isCardExpiryInFuture("10/26", today)).toBe(false);
  });
});
