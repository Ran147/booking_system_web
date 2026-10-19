import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { assertRecaptcha, RECAPTCHA_SECRETS } from "./assertRecaptcha.js";
import {
  PASSWORD_RESET,
  PASSWORD_RESET_ERROR,
} from "./constants/PasswordReset.constants.js";
import type {
  RequestPasswordResetPayload,
  RequestPasswordResetResponse,
} from "./models/RequestPasswordReset.mutation.js";
import { requestPasswordResetPayloadSchema } from "./models/RequestPasswordReset.schema.js";
import { FIREBASE_AUTH_ERROR_CODE } from "../shared/constants/FirebaseAuthErrorCode.constants.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { LANGUAGE } from "../shared/constants/Language.constants.js";
import { auth, firestore } from "../shared/firebaseAdmin.js";
import { hasErrorCode } from "../shared/hasErrorCode.js";
import { isEmulator } from "../shared/isEmulator.js";
import { readPayload } from "../shared/readPayload.js";
import type { NullableRef } from "../shared/types/Nullable.js";

// US-36 (P-1 = B): the visitor asks for a reset link without signing in. The
// function checks the reCAPTCHA, finds the account, reads the language saved
// in User.language and asks Firebase Auth to email the link in that language.
// It answers { isRequested: true } whether or not the account exists, so the
// answer never reveals it (AC-KAN-36-02). Errors the client maps:
// - invalid-argument: the payload or the reCAPTCHA token is missing.
// - permission-denied: Google rejected the token (unsolved, expired, reused).
// - unavailable: Google could not be reached.

// The public web API key of the Firebase project. Only the Emulator Suite may
// run without it (the Auth emulator needs no real key); anywhere else a missing
// or empty key is a configuration error that must fail visibly, instead of
// answering "sent" while Google rejects every request. It does not depend on
// the account, so failing here reveals nothing about it.
const readWebApiKey = (): string => {
  const configuredKey = process.env[PASSWORD_RESET.WEB_API_KEY_ENV_VAR]?.trim();
  if (configuredKey) return configuredKey;
  if (isEmulator()) return PASSWORD_RESET.DEFAULT_WEB_API_KEY;

  logger.error(PASSWORD_RESET_ERROR.MISSING_WEB_API_KEY);
  throw new HttpsError("internal", PASSWORD_RESET_ERROR.MISSING_WEB_API_KEY);
};

// Inside the Emulator Suite the email goes to the Auth emulator, which keeps
// the reset link (no email is sent).
const buildSendOobCodeUrl = (webApiKey: string): string => {
  const emulatorHost = process.env[PASSWORD_RESET.EMULATOR_HOST_ENV_VAR];
  const baseUrl =
    isEmulator() && emulatorHost
      ? `http://${emulatorHost}/${PASSWORD_RESET.EMULATOR_AUTH_PATH}`
      : PASSWORD_RESET.PRODUCTION_URL;

  return `${baseUrl}?${new URLSearchParams({ key: webApiKey }).toString()}`;
};

// Asks Firebase Auth to email the reset link in the given language. A failure
// (too many requests, the service down) is logged and swallowed: the caller
// answers the same either way, so nobody can tell whether the account exists
// (AC-KAN-36-02, D-1b).
const sendPasswordResetEmail = async (
  email: string,
  language: string,
  webApiKey: string,
): Promise<void> => {
  try {
    const sendResponse = await fetch(buildSendOobCodeUrl(webApiKey), {
      body: JSON.stringify({
        email,
        requestType: PASSWORD_RESET.REQUEST_TYPE,
      }),
      headers: {
        "Content-Type": "application/json",
        [PASSWORD_RESET.LOCALE_HEADER]: language,
      },
      method: "POST",
    });
    if (!sendResponse.ok) {
      logger.warn("Password reset email was not sent", {
        status: sendResponse.status,
      });
    }
  } catch (error) {
    logger.error("Password reset email request failed", error);
  }
};

const isSupportedLanguage = (language: unknown): language is string =>
  language === LANGUAGE.ES || language === LANGUAGE.EN;

const readAccountLanguage = async (userId: string): Promise<string> => {
  const userSnapshot = await firestore
    .collection(FIRESTORE_COLLECTION.USERS)
    .doc(userId)
    .get();
  const savedLanguage: unknown = userSnapshot.get("language");

  return isSupportedLanguage(savedLanguage) ? savedLanguage : LANGUAGE.ES;
};

const findUserId = async (email: string): Promise<NullableRef<string>> => {
  try {
    return (await auth.getUserByEmail(email)).uid;
  } catch (error) {
    if (hasErrorCode(error, FIREBASE_AUTH_ERROR_CODE.USER_NOT_FOUND)) {
      return null;
    }
    throw error;
  }
};

const sendResetEmailIfAccountExists = async (
  email: string,
  webApiKey: string,
): Promise<void> => {
  try {
    const userId = await findUserId(email);
    if (userId) {
      await sendPasswordResetEmail(
        email,
        await readAccountLanguage(userId),
        webApiKey,
      );
    }
  } catch (error) {
    // An infrastructure failure must not tell the visitor anything about the
    // account either.
    logger.error("Password reset request failed", error);
  }
};

const waitForMinimumResponseTime = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, PASSWORD_RESET.MINIMUM_RESPONSE_MS);
  });

export const requestPasswordReset = onCall<
  RequestPasswordResetPayload,
  Promise<RequestPasswordResetResponse>
>({ secrets: RECAPTCHA_SECRETS }, async (request) => {
  const { email, recaptchaToken } = readPayload(
    requestPasswordResetPayloadSchema,
    request.data,
    PASSWORD_RESET_ERROR.INVALID_PAYLOAD,
  );
  await assertRecaptcha(recaptchaToken);
  const webApiKey = readWebApiKey();

  // Both paths last the same: an existing account costs a Firestore read and a
  // call to Google, and that extra time would reveal it (AC-KAN-36-02).
  await Promise.all([
    sendResetEmailIfAccountExists(email, webApiKey),
    waitForMinimumResponseTime(),
  ]);

  return { isRequested: true };
});
