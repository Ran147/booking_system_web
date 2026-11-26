import { CallableFailure } from "../shared/CallableFailure.js";
import {
  RECAPTCHA_VERIFICATION,
  RECAPTCHA_VERIFICATION_ERROR,
} from "../shared/constants/Recaptcha.constants.js";

// Asks Google whether a reCAPTCHA token is valid (Q8): free of
// firebase-functions, so the callables (assertRecaptcha) and the Vercel
// dispatcher (api/) share it. Each one brings its own secret key.
// - permission-denied: Google rejected the token (unsolved, expired, reused).
// - unavailable: Google could not be reached.

const isSuccessfulVerification = (verificationResult: unknown): boolean =>
  typeof verificationResult === "object" &&
  verificationResult !== null &&
  "success" in verificationResult &&
  verificationResult.success === true;

const askGoogleToVerify = async (
  recaptchaToken: string,
  secretKey: string,
): Promise<unknown> => {
  try {
    const verificationResponse = await fetch(
      RECAPTCHA_VERIFICATION.VERIFY_URL,
      {
        body: new URLSearchParams({
          [RECAPTCHA_VERIFICATION.FORM_FIELD.RESPONSE]: recaptchaToken,
          [RECAPTCHA_VERIFICATION.FORM_FIELD.SECRET]: secretKey,
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
    throw new CallableFailure(
      "unavailable",
      RECAPTCHA_VERIFICATION_ERROR.UNREACHABLE,
    );
  }
};

export const verifyRecaptchaToken = async (
  recaptchaToken: string,
  secretKey: string,
): Promise<void> => {
  const verificationResult = await askGoogleToVerify(recaptchaToken, secretKey);

  if (!isSuccessfulVerification(verificationResult)) {
    throw new CallableFailure(
      "permission-denied",
      RECAPTCHA_VERIFICATION_ERROR.REJECTED,
    );
  }
};
