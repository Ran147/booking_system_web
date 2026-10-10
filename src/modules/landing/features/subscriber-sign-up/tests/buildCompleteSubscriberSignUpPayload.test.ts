import { DEFAULT_LANGUAGE, LANGUAGE } from "@/shared/constants";
import { buildCompleteSubscriberSignUpPayload } from "../utils/buildCompleteSubscriberSignUpPayload";

const FORM_VALUES = {
  businessName: "Barbería Centro",
  businessSlug: "barberia-centro",
  email: "duena@negocio.com",
  firstName: "Ana",
  lastName: "Pérez",
  password: "Reserva!2026",
  passwordConfirmation: "Reserva!2026",
  phone: "",
};

const buildPayload = (
  activeLanguage: string,
): ReturnType<typeof buildCompleteSubscriberSignUpPayload> =>
  buildCompleteSubscriberSignUpPayload(FORM_VALUES, {
    activeLanguage,
    signUpToken: "token",
    timeZone: "America/Mexico_City",
  });

describe("buildCompleteSubscriberSignUpPayload", () => {
  it("KAN-25: AS-4 sends the active landing language", () => {
    expect(buildPayload(LANGUAGE.EN).language).toBe(LANGUAGE.EN);
  });

  it("KAN-25: AS-4 sends the default language for an unsupported one", () => {
    expect(buildPayload("fr-FR").language).toBe(DEFAULT_LANGUAGE);
  });

  it("KAN-25: AC-KAN-25-14 leaves out the email and the password confirmation", () => {
    expect(buildPayload(LANGUAGE.ES)).not.toHaveProperty("email");
    expect(buildPayload(LANGUAGE.ES)).not.toHaveProperty(
      "passwordConfirmation",
    );
  });
});
