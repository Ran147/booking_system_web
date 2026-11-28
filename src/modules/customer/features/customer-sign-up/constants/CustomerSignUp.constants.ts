import type { CustomerSignUpFormValues } from "../models/CustomerSignUpForm.schema";

// Mirror of VERIFICATION_EMAIL_STATUS in
// functions/src/auth/constants/CustomerSignUp.constants.ts — keep in sync.
export const VERIFICATION_EMAIL_STATUS = Object.freeze({
  SEND_FAILED: "sendFailed",
  SENT: "sent",
} as const);

export type VerificationEmailStatus =
  (typeof VERIFICATION_EMAIL_STATUS)[keyof typeof VERIFICATION_EMAIL_STATUS];

export const DEFAULT_CUSTOMER_SIGN_UP_FORM_VALUES: CustomerSignUpFormValues =
  Object.freeze({
    email: "",
    fullName: "",
    password: "",
    phone: "",
  });
