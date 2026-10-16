import { defineSecret } from "firebase-functions/params";
import { HttpsError } from "firebase-functions/v2/https";
import {
  RECAPTCHA_VERIFICATION,
  RECAPTCHA_VERIFICATION_ERROR,
} from "../shared/constants/Recaptcha.constants.js";

// Verifies a reCAPTCHA token inside the function that runs the protected
// action, so a script cannot skip the check (auth-and-roles §5,
// cloud-functions-standards §5). Errors the client maps:
// - permission-denied: Google rejected the token (unsolved, expired, reused).
// - unavailable: Google could not be reached.

const recaptchaSecretKey = defineSecret(RECAPTCHA_VERIFICATION.SECRET_NAME);

const isEmulator = (): boolean =>
  process.env[RECAPTCHA_VERIFICATION.EMULATOR_ENV_VAR] ===
  RECAPTCHA_VERIFICATION.EMULATOR_FLAG_ENABLED;

// Every function that calls assertRecaptcha declares these in its options:
// onCall({ secrets: RECAPTCHA_SECRETS }, ...).
export const RECAPTCHA_SECRETS = isEmulator() ? [] : [recaptchaSecretKey];

const readSecretKey = (): string =>
  isEmulator()
    ? RECAPTCHA_VERIFICATION.TEST_SECRET_KEY
    : recaptchaSecretKey.value();

const isSuccessfulVerification = (verificationResult: unknown): boolean =>
  typeof verificationResult === "object" &&
  verificationResult !== null &&
  "success" in verificationResult &&
  verificationResult.success === true;

const askGoogleToVerify = async (recaptchaToken: string): Promise<unknown> => {
  try {
    const verificationResponse = await fetch(
      RECAPTCHA_VERIFICATION.VERIFY_URL,
      {
        body: new URLSearchParams({
          [RECAPTCHA_VERIFICATION.FORM_FIELD.RESPONSE]: recaptchaToken,
          [RECAPTCHA_VERIFICATION.FORM_FIELD.SECRET]: readSecretKey(),
        }),
        method: "POST",
      },
    );
    if (!verificationResponse.ok) {
      throw new Error(verificationResponse.statusText);
    }
    return await verificationResponse.json();
  } catch {
    // Network failure, a non-2xx answer or a body that is not JSON.
    throw new HttpsError(
      "unavailable",
      RECAPTCHA_VERIFICATION_ERROR.UNREACHABLE,
    );
  }
};

export const assertRecaptcha = async (
  recaptchaToken: string,
): Promise<void> => {
  const verificationResult = await askGoogleToVerify(recaptchaToken);

  if (!isSuccessfulVerification(verificationResult)) {
    throw new HttpsError(
      "permission-denied",
      RECAPTCHA_VERIFICATION_ERROR.REJECTED,
    );
  }
};
