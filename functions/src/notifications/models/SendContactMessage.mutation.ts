export interface SendContactMessagePayload {
  readonly email: string;
  readonly message: string;
  readonly name: string;
  readonly recaptchaToken: string;
  readonly subject: string;
}

export interface SendContactMessageResponse {
  readonly isSent: true;
}
