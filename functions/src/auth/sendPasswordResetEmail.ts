import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import {
  PASSWORD_RESET,
  PASSWORD_RESET_ERROR,
} from "./constants/PasswordReset.constants.js";

const isEmulator = (): boolean =>
  process.env[PASSWORD_RESET.EMULATOR_ENV_VAR] ===
  PASSWORD_RESET.EMULATOR_FLAG_ENABLED;

// The public web API key of the Firebase project. Only the Emulator Suite may
// run without it (the Auth emulator needs no real key); anywhere else a missing
// or empty key is a configuration error that must fail visibly, instead of
// answering "sent" while Google rejects every request. It does not depend on
// the account, so failing here reveals nothing about it.
export const readWebApiKey = (): string => {
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
export const sendPasswordResetEmail = async (
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
