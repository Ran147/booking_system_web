import { VALIDATION_MESSAGE_KEY } from "@/shared/constants";
import { RESERVED_BUSINESS_SLUG } from "@/shared/domain";
import { SUBSCRIBER_SIGN_UP_MESSAGE_KEY } from "../constants/SubscriberSignUpForm.constants";
import {
  subscriberSignUpFormSchema,
  type SubscriberSignUpFormValues,
} from "../models/SubscriberSignUpForm.schema";

const VALID_FORM_VALUES: SubscriberSignUpFormValues = {
  businessName: "Barbería Centro",
  businessSlug: "barberia-centro",
  email: "duena@negocio.com",
  firstName: "Ana",
  lastName: "Pérez",
  password: "Reserva!2026",
  passwordConfirmation: "Reserva!2026",
  phone: "",
};

const readFieldMessage = (
  formValues: Partial<SubscriberSignUpFormValues>,
  fieldName: keyof SubscriberSignUpFormValues,
): string =>
  subscriberSignUpFormSchema
    .safeParse({ ...VALID_FORM_VALUES, ...formValues })
    .error?.issues.find((issue) => issue.path[0] === fieldName)?.message ?? "";

describe("subscriberSignUpFormSchema", () => {
  it("KAN-25: accepts a complete form with an optional empty phone", () => {
    expect(
      subscriberSignUpFormSchema.safeParse(VALID_FORM_VALUES).success,
    ).toBe(true);
  });

  it("KAN-25: names outside 2-60 characters are too short or too long", () => {
    expect(readFieldMessage({ firstName: "A" }, "firstName")).toBe(
      VALIDATION_MESSAGE_KEY.TOO_SHORT,
    );
    expect(readFieldMessage({ lastName: "a".repeat(61) }, "lastName")).toBe(
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    );
  });

  it("KAN-25: a phone with letters is rejected", () => {
    expect(readFieldMessage({ phone: "88a-1234" }, "phone")).toBe(
      SUBSCRIBER_SIGN_UP_MESSAGE_KEY.PHONE_INVALID,
    );
  });

  it("KAN-25: a slug with capitals, double hyphens or edge hyphens is invalid", () => {
    ["Barberia", "barberia--centro", "-barberia", "barberia-"].forEach(
      (invalidSlug) => {
        expect(
          readFieldMessage({ businessSlug: invalidSlug }, "businessSlug"),
        ).toBe(SUBSCRIBER_SIGN_UP_MESSAGE_KEY.SLUG_INVALID);
      },
    );
  });

  it("KAN-25: a slug outside 3-40 characters is too short or too long", () => {
    expect(readFieldMessage({ businessSlug: "ab" }, "businessSlug")).toBe(
      VALIDATION_MESSAGE_KEY.TOO_SHORT,
    );
    expect(
      readFieldMessage({ businessSlug: "a".repeat(41) }, "businessSlug"),
    ).toBe(VALIDATION_MESSAGE_KEY.TOO_LONG);
  });

  it("KAN-25: a reserved slug is rejected", () => {
    expect(
      readFieldMessage(
        { businessSlug: RESERVED_BUSINESS_SLUG.ADMIN },
        "businessSlug",
      ),
    ).toBe(SUBSCRIBER_SIGN_UP_MESSAGE_KEY.SLUG_RESERVED);
  });

  it("KAN-25: a business name outside 2-80 characters is rejected", () => {
    expect(readFieldMessage({ businessName: "B" }, "businessName")).toBe(
      VALIDATION_MESSAGE_KEY.TOO_SHORT,
    );
    expect(
      readFieldMessage({ businessName: "b".repeat(81) }, "businessName"),
    ).toBe(VALIDATION_MESSAGE_KEY.TOO_LONG);
  });

  it("KAN-25: a confirmation that differs from the password is rejected", () => {
    expect(
      readFieldMessage(
        { passwordConfirmation: "Reserva!2027" },
        "passwordConfirmation",
      ),
    ).toBe(SUBSCRIBER_SIGN_UP_MESSAGE_KEY.PASSWORD_MISMATCH);
  });
});
