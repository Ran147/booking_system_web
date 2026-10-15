import { HttpsError, onCall } from "firebase-functions/v2/https";
import { assertRecaptcha, RECAPTCHA_SECRETS } from "./assertRecaptcha.js";
import { RECAPTCHA_VERIFICATION_ERROR } from "../shared/constants/Recaptcha.constants.js";

// Sign-in calls this before Firebase Auth, because sign-in has no function of
// its own. Actions that run in a function (sign-up, contact, recovery) call
// assertRecaptcha inside it instead (auth-and-roles §5). Errors the client
// maps:
// - invalid-argument: no token was sent.
// - permission-denied: Google rejected the token (unsolved, expired, reused).
// - unavailable: Google could not be reached.

export interface VerifyRecaptchaPayload {
  readonly recaptchaToken: string;
}

export interface VerifyRecaptchaResponse {
  readonly isVerified: true;
}

const readRecaptchaToken = (payload: unknown): string => {
  const recaptchaToken =
    typeof payload === "object" &&
    payload !== null &&
    "recaptchaToken" in payload
      ? payload.recaptchaToken
      : null;

  if (typeof recaptchaToken !== "string" || recaptchaToken.length === 0) {
    throw new HttpsError(
      "invalid-argument",
      RECAPTCHA_VERIFICATION_ERROR.MISSING_TOKEN,
    );
  }
  return recaptchaToken;
};

export const verifyRecaptcha = onCall<
  VerifyRecaptchaPayload,
  Promise<VerifyRecaptchaResponse>
>({ secrets: RECAPTCHA_SECRETS }, async (request) => {
  await assertRecaptcha(readRecaptchaToken(request.data));
  return { isVerified: true };
});
