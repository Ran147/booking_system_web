import type { MutationError, Nullable } from "@/shared/types";
import type { SignUpErrorReason } from "../constants/SubscriberSignUpServer.constants";

/**
 * A sign-up function error: the common MutationError plus the details.reason
 * the function sent, when it is one of SIGN_UP_ERROR_REASON.
 */
export interface SignUpFunctionError extends MutationError {
  readonly reason: Nullable<SignUpErrorReason>;
}
