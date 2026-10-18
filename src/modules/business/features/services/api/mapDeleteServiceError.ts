import { FunctionsError } from "firebase/functions";
import { mapFirebaseError } from "@/services/firebase";
import type { Nullable } from "@/types";
import {
  DELETE_SERVICE_ERROR_REASON,
  type DeleteServiceErrorReason,
} from "../constants/DeleteServiceError.constants";
import type { DeleteServiceError } from "../models/DeleteServiceError.interface";

const isDeleteServiceErrorReason = (
  reason: unknown,
): reason is DeleteServiceErrorReason =>
  Object.values(DELETE_SERVICE_ERROR_REASON).some(
    (validReason) => validReason === reason,
  );

const readDeleteServiceErrorReason = (
  error: unknown,
): Nullable<DeleteServiceErrorReason> => {
  if (!(error instanceof FunctionsError)) {
    return null;
  }
  const details: unknown = error.details;
  if (typeof details !== "object" || details === null) {
    return null;
  }
  const reason: unknown = Reflect.get(details, "reason");
  return isDeleteServiceErrorReason(reason) ? reason : null;
};

/**
 * Maps an error from the deleteService Callable function to a typed DeleteServiceError
 * preserving the reason if provided by the backend.
 */
export const mapDeleteServiceError = (error: unknown): DeleteServiceError => {
  const mutationError = mapFirebaseError(error);
  return {
    ...mutationError,
    reason: readDeleteServiceErrorReason(error),
  };
};
