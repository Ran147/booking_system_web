import { logger } from "firebase-functions";
import { PASSWORD_RESET } from "./constants/PasswordReset.constants.js";

const isEmulator = (): boolean =>
  process.env[PASSWORD_RESET.EMULATOR_ENV_VAR] ===
  PASSWORD_RESET.EMULATOR_FLAG_ENABLED;

// Inside the Emulator Suite the email goes to the Auth emulator, which keeps
// the reset link (no email is sent) and needs no real key.
const buildSendOobCodeUrl = (): string => {
  const webApiKey =
    process.env[PASSWORD_RESET.WEB_API_KEY_ENV_VAR] ??
    PASSWORD_RESET.DEFAULT_WEB_API_KEY;
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
): Promise<void> => {
  try {
    const sendResponse = await fetch(buildSendOobCodeUrl(), {
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
