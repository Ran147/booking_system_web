export interface ValidateSignUpLinkPayload {
  readonly signUpToken: string;
}

export interface ValidateSignUpLinkResponse {
  readonly amountInCents: number;
  readonly billingPeriod: string;
  readonly checkoutEmail: string;
  readonly planName: string;
}
