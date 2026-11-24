import { onCall } from "firebase-functions/v2/https";
import { handlePayPlanCheckout } from "./handlers/handlePayPlanCheckout.js";
import type {
  PayPlanCheckoutPayload,
  PayPlanCheckoutResponse,
} from "./models/PayPlanCheckout.mutation.js";
import { assertRecaptcha, RECAPTCHA_SECRETS } from "../auth/assertRecaptcha.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { toHttpsError } from "../shared/toHttpsError.js";

// The callable runs only in the Emulator Suite; production runs the same
// handler through the Vercel dispatcher (Q8).
export const payPlanCheckout = onCall<
  PayPlanCheckoutPayload,
  Promise<PayPlanCheckoutResponse>
>({ secrets: RECAPTCHA_SECRETS }, async (request) => {
  try {
    return await handlePayPlanCheckout({
      assertRecaptcha,
      caller: null,
      firestore,
      now: new Date(),
      payload: request.data,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});
