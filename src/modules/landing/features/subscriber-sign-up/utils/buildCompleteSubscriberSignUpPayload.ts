import { DEFAULT_LANGUAGE, LANGUAGE, type Language } from "@/shared/constants";
import type { CompleteSubscriberSignUpPayload } from "../models/CompleteSubscriberSignUp.mutation";
import type { SubscriberSignUpFormValues } from "../models/SubscriberSignUpForm.schema";

export interface SignUpContext {
  /** Active landing language (AS-4); anything unsupported becomes the default. */
  readonly activeLanguage: string;
  readonly signUpToken: string;
  /** IANA time zone of the browser (AS-8). */
  readonly timeZone: string;
}

const toSupportedLanguage = (activeLanguage: string): Language =>
  Object.values(LANGUAGE).find((language) => language === activeLanguage) ??
  DEFAULT_LANGUAGE;

// The email and the password confirmation stay in the form: the server takes
// the email from the checkout (AC-KAN-25-14).
export const buildCompleteSubscriberSignUpPayload = (
  formValues: SubscriberSignUpFormValues,
  { activeLanguage, signUpToken, timeZone }: SignUpContext,
): CompleteSubscriberSignUpPayload => ({
  businessName: formValues.businessName,
  businessSlug: formValues.businessSlug,
  firstName: formValues.firstName,
  language: toSupportedLanguage(activeLanguage),
  lastName: formValues.lastName,
  password: formValues.password,
  phone: formValues.phone,
  signUpToken,
  timeZone,
});
