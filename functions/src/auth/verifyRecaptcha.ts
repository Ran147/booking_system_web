import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  RECAPTCHA_VERIFICATION,
  RECAPTCHA_VERIFICATION_ERROR,
} from "../shared/constants/Recaptcha.constants.js";

// Public forms (sign-in, sign-up, contact, recovery) call this before their
// action runs (auth-and-roles §5). Errors the client maps:
// - invalid-argument: no token was sent.
// - permission-denied: Google rejected the token (unsolved, expired, reused).
// - unavailable: Google could not be reached.

export interface VerifyRecaptchaPayload {
  readonly recaptchaToken: string;
}

export interface VerifyRecaptchaResponse {
  readonly isVerified: true;
}

const recaptchaSecretKey = defineSecret(RECAPTCHA_VERIFICATION.SECRET_NAME);

const isEmulator =
  process.env[RECAPTCHA_VERIFICATION.EMULATOR_ENV_VAR] ===
  RECAPTCHA_VERIFICATION.EMULATOR_FLAG_ENABLED;

const readSecretKey = (): string =>
  isEmulator
    ? RECAPTCHA_VERIFICATION.TEST_SECRET_KEY
    : recaptchaSecretKey.value();

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

export const verifyRecaptcha = onCall<
  VerifyRecaptchaPayload,
  Promise<VerifyRecaptchaResponse>
>({ secrets: isEmulator ? [] : [recaptchaSecretKey] }, async (request) => {
  const recaptchaToken = readRecaptchaToken(request.data);
  const verificationResult = await askGoogleToVerify(recaptchaToken);

  if (!isSuccessfulVerification(verificationResult)) {
    throw new HttpsError(
      "permission-denied",
      RECAPTCHA_VERIFICATION_ERROR.REJECTED,
    );
  }
  return { isVerified: true };
});
