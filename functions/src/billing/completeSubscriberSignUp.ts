import { logger } from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import { handleCompleteSubscriberSignUp } from "./handlers/handleCompleteSubscriberSignUp.js";
import type {
  CompleteSubscriberSignUpPayload,
  CompleteSubscriberSignUpResponse,
} from "./models/CompleteSubscriberSignUp.mutation.js";
import { assertRecaptcha, RECAPTCHA_SECRETS } from "../auth/assertRecaptcha.js";
import { auth, firestore } from "../shared/firebaseAdmin.js";
import { toHttpsError } from "../shared/toHttpsError.js";

// The callable runs only in the Emulator Suite; production runs the same
// handler through the Vercel dispatcher (Q8).
export const completeSubscriberSignUp = onCall<
  CompleteSubscriberSignUpPayload,
  Promise<CompleteSubscriberSignUpResponse>
>({ secrets: RECAPTCHA_SECRETS }, async (request) => {
  try {
    return await handleCompleteSubscriberSignUp({
      assertRecaptcha,
      auth,
      caller: null,
      firestore,
      now: new Date(),
      payload: request.data,
      reportError: (message, context) => {
        logger.warn(message, context);
      },
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});
