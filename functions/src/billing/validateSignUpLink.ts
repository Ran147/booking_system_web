import { onCall } from "firebase-functions/v2/https";
import { handleValidateSignUpLink } from "./handlers/handleValidateSignUpLink.js";
import type {
  ValidateSignUpLinkPayload,
  ValidateSignUpLinkResponse,
} from "./models/ValidateSignUpLink.mutation.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { toHttpsError } from "../shared/toHttpsError.js";

// The callable runs only in the Emulator Suite; production runs the same
// handler through the Vercel dispatcher (Q8).
export const validateSignUpLink = onCall<
  ValidateSignUpLinkPayload,
  Promise<ValidateSignUpLinkResponse>
>(async (request) => {
  try {
    return await handleValidateSignUpLink({
      caller: null,
      firestore,
      now: new Date(),
      payload: request.data,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});
