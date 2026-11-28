import { defineSecret } from "firebase-functions/params";
import { verifyRecaptchaToken } from "./verifyRecaptchaToken.js";
import { RECAPTCHA_VERIFICATION } from "../shared/constants/Recaptcha.constants.js";
import { isEmulator } from "../shared/isEmulator.js";
import { toHttpsError } from "../shared/toHttpsError.js";

// Verifies a reCAPTCHA token inside the function that runs the protected
// action, so a script cannot skip the check (auth-and-roles §5,
// cloud-functions-standards §5). Errors the client maps:
// - permission-denied: Google rejected the token (unsolved, expired, reused).
// - unavailable: Google could not be reached.

const recaptchaSecretKey = defineSecret(RECAPTCHA_VERIFICATION.SECRET_NAME);

// Every function that calls assertRecaptcha declares these in its options:
// onCall({ secrets: RECAPTCHA_SECRETS }, ...).
export const RECAPTCHA_SECRETS = isEmulator() ? [] : [recaptchaSecretKey];

const readSecretKey = (): string =>
  isEmulator()
    ? RECAPTCHA_VERIFICATION.TEST_SECRET_KEY
    : recaptchaSecretKey.value();

export const assertRecaptcha = async (
  recaptchaToken: string,
): Promise<void> => {
  try {
    await verifyRecaptchaToken(recaptchaToken, readSecretKey());
  } catch (error) {
    throw toHttpsError(error);
  }
};
