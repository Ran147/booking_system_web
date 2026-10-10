import { FunctionsError } from "firebase/functions";
import { ERROR_MESSAGE_KEY } from "@/shared/constants";
import { mapFirebaseError } from "@/shared/lib/firebase";
import type { Nullable } from "@/shared/types";
import {
  SIGN_UP_ERROR_REASON,
  type SignUpErrorReason,
} from "../constants/SubscriberSignUpServer.constants";
import type { SignUpFunctionError } from "../models/SignUpFunctionError.interface";

const isSignUpErrorReason = (reason: unknown): reason is SignUpErrorReason =>
  Object.values(SIGN_UP_ERROR_REASON).some(
    (signUpErrorReason) => signUpErrorReason === reason,
  );

const readErrorReason = (error: unknown): Nullable<SignUpErrorReason> => {
  if (!(error instanceof FunctionsError)) return null;
  const { details } = error;
  if (typeof details !== "object" || details === null) return null;
  const reason: unknown = Reflect.get(details, "reason");
  return isSignUpErrorReason(reason) ? reason : null;
};

// Converts a sign-up function error once, at the api/ boundary
// (api-mutation-standards §3). A callable that cannot reach the server fails
// with functions/internal, like a server crash, so an offline browser is
// reported as a network error (AC-KAN-25-10).
export const mapSignUpFunctionError = (error: unknown): SignUpFunctionError => {
  const mutationError = mapFirebaseError(error);
  return {
    ...mutationError,
    messageKey: navigator.onLine
      ? mutationError.messageKey
      : ERROR_MESSAGE_KEY.NETWORK,
    reason: readErrorReason(error),
  };
};
