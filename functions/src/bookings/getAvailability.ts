import { onCall } from "firebase-functions/v2/https";
import { handleGetAvailability } from "./handlers/handleGetAvailability.js";
import type {
  GetAvailabilityPayload,
  GetAvailabilityResponse,
} from "./models/GetAvailability.query.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { toHttpsError } from "../shared/toHttpsError.js";

// The callable runs only in the Emulator Suite; production runs the same
// handler through the Vercel dispatcher (Q8).
export const getAvailability = onCall<
  GetAvailabilityPayload,
  Promise<GetAvailabilityResponse>
>(async (request) => {
  try {
    return await handleGetAvailability({
      caller: request.auth
        ? { role: request.auth.token.role, uid: request.auth.uid }
        : null,
      payload: request.data,
      firestore,
      now: new Date(),
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});
