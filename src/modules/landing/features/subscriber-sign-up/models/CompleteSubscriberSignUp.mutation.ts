// Contract of the completeSubscriberSignUp function (SPEC "Server functions").
// No email (it comes from the checkout) and no password confirmation (checked
// in the form); phone is empty when left out (AS-1). recaptchaToken is added
// with the reCAPTCHA field (AC-KAN-25-08, US-33).
export interface CompleteSubscriberSignUpPayload {
  readonly businessName: string;
  readonly businessSlug: string;
  readonly firstName: string;
  readonly language: string;
  readonly lastName: string;
  readonly password: string;
  readonly phone: string;
  readonly signUpToken: string;
  readonly timeZone: string;
}

export interface CompleteSubscriberSignUpResponse {
  /** Pre-fills the sign-in email (KAN-27). */
  readonly email: string;
}
