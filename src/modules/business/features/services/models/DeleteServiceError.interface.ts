import type { MutationError, Nullable } from "@/types";
import type { DeleteServiceErrorReason } from "../constants/DeleteServiceError.constants";

/**
 * Error returned when deleting a service fails, including server-provided reason details.
 */
export interface DeleteServiceError extends MutationError {
  readonly reason: Nullable<DeleteServiceErrorReason>;
}
