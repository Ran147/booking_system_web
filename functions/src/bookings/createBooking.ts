import { onCall } from "firebase-functions/v2/https";
import { handleCreateBooking } from "./handlers/handleCreateBooking.js";
import type {
  CreateBookingPayload,
  CreateBookingResponse,
} from "./models/CreateBooking.mutation.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { toHttpsError } from "../shared/toHttpsError.js";

// The callable runs only in the Emulator Suite; production runs the same
// handler through the Vercel dispatcher (Q8).
export const createBooking = onCall<
  CreateBookingPayload,
  Promise<CreateBookingResponse>
>(async (request) => {
  try {
    return await handleCreateBooking({
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
