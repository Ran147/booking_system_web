import { HttpsError } from "firebase-functions/v2/https";
import { CallableFailure } from "./CallableFailure.js";

// The onCall side of a shared handler (Q8): a CallableFailure becomes the
// HttpsError the client already maps; anything else is rethrown as is.
export const toHttpsError = (error: unknown): unknown =>
  error instanceof CallableFailure
    ? new HttpsError(error.code, error.message, error.details)
    : error;
