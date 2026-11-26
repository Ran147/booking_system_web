import type { Auth } from "firebase-admin/auth";
import { CUSTOMER_SIGN_UP } from "./constants/CustomerSignUp.constants.js";
import { PASSWORD_RESET } from "./constants/PasswordReset.constants.js";
import type { SendVerificationEmail } from "./models/CompleteCustomerSignUp.mutation.js";
import { isEmulator } from "../shared/isEmulator.js";
import type { Nullable, NullableRef } from "../shared/types/Nullable.js";

const { IDENTITY_TOOLKIT } = CUSTOMER_SIGN_UP;

const JSON_HEADERS = Object.freeze({ "Content-Type": "application/json" });

interface VerificationEmailSenderOptions {
  readonly auth: Auth;
  /** Public web API key of the Firebase project; null when not configured. */
  readonly webApiKey: Nullable<string>;
}

// Inside the Emulator Suite the requests go to the Auth emulator, which keeps
// the link instead of sending an email (same as US-36).
const buildIdentityToolkitUrl = (
  endpoint: string,
  webApiKey: string,
): string => {
  const emulatorHost = process.env[PASSWORD_RESET.EMULATOR_HOST_ENV_VAR];
  const baseUrl =
    isEmulator() && emulatorHost
      ? `http://${emulatorHost}/${IDENTITY_TOOLKIT.EMULATOR_BASE_PATH}`
      : IDENTITY_TOOLKIT.PRODUCTION_BASE_URL;

  return `${baseUrl}/${endpoint}?${new URLSearchParams({ key: webApiKey }).toString()}`;
};

const readIdToken = (signInResult: unknown): NullableRef<string> => {
  if (typeof signInResult !== "object" || signInResult === null) return null;
  const idToken: unknown = Reflect.get(signInResult, "idToken");
  return typeof idToken === "string" ? idToken : null;
};

// Spec D2: the first verification email is asked for by the server, so the
// browser never signs in halfway through the sign-up. A custom token becomes
// an ID token of the new account, and that ID token asks Firebase Auth to
// send its verification template in the visitor's language. It never throws:
// the account already exists, so a failure only means "sendFailed"
// (AC-KAN-126-04).
export const createVerificationEmailSender =
  ({
    auth,
    webApiKey,
  }: VerificationEmailSenderOptions): SendVerificationEmail =>
  async (userId, language, continueUrl) => {
    if (!webApiKey) return false;
    try {
      const signInResponse = await fetch(
        buildIdentityToolkitUrl(
          IDENTITY_TOOLKIT.SIGN_IN_WITH_CUSTOM_TOKEN,
          webApiKey,
        ),
        {
          body: JSON.stringify({
            returnSecureToken: true,
            token: await auth.createCustomToken(userId),
          }),
          headers: JSON_HEADERS,
          method: "POST",
        },
      );
      const idToken = signInResponse.ok
        ? readIdToken(await signInResponse.json())
        : null;
      if (!idToken) return false;

      const sendResponse = await fetch(
        buildIdentityToolkitUrl(IDENTITY_TOOLKIT.SEND_OOB_CODE, webApiKey),
        {
          body: JSON.stringify({
            continueUrl,
            idToken,
            requestType: IDENTITY_TOOLKIT.VERIFY_EMAIL_REQUEST_TYPE,
          }),
          headers: {
            ...JSON_HEADERS,
            [PASSWORD_RESET.LOCALE_HEADER]: language,
          },
          method: "POST",
        },
      );
      return sendResponse.ok;
    } catch {
      return false;
    }
  };
