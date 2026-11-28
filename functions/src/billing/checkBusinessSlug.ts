import { onCall } from "firebase-functions/v2/https";
import { handleCheckBusinessSlug } from "./handlers/handleCheckBusinessSlug.js";
import type {
  CheckBusinessSlugPayload,
  CheckBusinessSlugResponse,
} from "./models/CheckBusinessSlug.mutation.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { toHttpsError } from "../shared/toHttpsError.js";

// The callable runs only in the Emulator Suite; production runs the same
// handler through the Vercel dispatcher (Q8).
export const checkBusinessSlug = onCall<
  CheckBusinessSlugPayload,
  Promise<CheckBusinessSlugResponse>
>(async (request) => {
  try {
    return await handleCheckBusinessSlug({
      caller: null,
      firestore,
      now: new Date(),
      payload: request.data,
    });
  } catch (error) {
    throw toHttpsError(error);
  }
});
