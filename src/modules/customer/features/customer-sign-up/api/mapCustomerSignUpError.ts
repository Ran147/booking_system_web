import { ERROR_MESSAGE_KEY, FIREBASE_ERROR_CODE } from "@/constants";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";

// Converts the sign-up error once, at the api/ boundary
// (api-mutation-standards §3). A callable that cannot reach the server fails
// with functions/internal, like a crash, so an offline browser is reported as
// a network error (AC-KAN-123-07); functions/unavailable means the server
// could not reach Google to check the reCAPTCHA.
export const mapCustomerSignUpError = (error: unknown): MutationError => {
  const mutationError = mapFirebaseError(error);
  const isNetworkError =
    !navigator.onLine ||
    mutationError.code === FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE;
  return isNetworkError
    ? { ...mutationError, messageKey: ERROR_MESSAGE_KEY.NETWORK }
    : mutationError;
};
