import { logger } from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import { assertRecaptcha, RECAPTCHA_SECRETS } from "./assertRecaptcha.js";
import { CUSTOMER_SIGN_UP_ERROR } from "./constants/CustomerSignUp.constants.js";
import { PASSWORD_RESET } from "./constants/PasswordReset.constants.js";
import { handleCompleteCustomerSignUp } from "./handlers/handleCompleteCustomerSignUp.js";
import type {
  CompleteCustomerSignUpPayload,
  CompleteCustomerSignUpResponse,
} from "./models/CompleteCustomerSignUp.mutation.js";
import { createVerificationEmailSender } from "./sendVerificationEmail.js";
import { auth, firestore } from "../shared/firebaseAdmin.js";
import { isEmulator } from "../shared/isEmulator.js";
import { toHttpsError } from "../shared/toHttpsError.js";
import type { NullableRef } from "../shared/types/Nullable.js";

// The public web API key, as in US-36: the Emulator Suite runs with the demo
// key. Without a key the account is still created and the answer is
// "sendFailed", so the visitor gets the resend path (AC-KAN-126-04).
const readWebApiKey = (): NullableRef<string> => {
  const configuredKey = process.env[PASSWORD_RESET.WEB_API_KEY_ENV_VAR]?.trim();
  if (configuredKey) return configuredKey;
  if (isEmulator()) return PASSWORD_RESET.DEFAULT_WEB_API_KEY;
  logger.error(CUSTOMER_SIGN_UP_ERROR.MISSING_WEB_API_KEY);
  return null;
};

// The callable runs only in the Emulator Suite; production runs the same
// handler through the Vercel dispatcher (Q8). Public: a visitor signs up.
export const completeCustomerSignUp = onCall<
  CompleteCustomerSignUpPayload,
  Promise<CompleteCustomerSignUpResponse>
>({ secrets: RECAPTCHA_SECRETS }, async (request) => {
  try {
    return await handleCompleteCustomerSignUp({
      auth,
      caller: null,
      firestore,
      now: new Date(),
      payload: request.data,
      sendVerificationEmail: createVerificationEmailSender({
        auth,
        webApiKey: readWebApiKey(),
      }),
      verifyRecaptcha: assertRecaptcha,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});
