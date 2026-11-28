// Full keys (namespace included): the banner shows customer and common texts.
export const RESEND_VERIFICATION_MESSAGE_KEY = Object.freeze({
  NETWORK: "common:errors.network",
  SENT: "customer:signUp.verification.sent",
  TOO_MANY_REQUESTS: "customer:signUp.verification.tooManyRequests",
  UNKNOWN: "common:errors.unknown",
} as const);

export type ResendVerificationMessageKey =
  (typeof RESEND_VERIFICATION_MESSAGE_KEY)[keyof typeof RESEND_VERIFICATION_MESSAGE_KEY];
