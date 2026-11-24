import { FunctionsError } from "firebase/functions";
import { ZodError } from "zod";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { mapFirebaseError } from "@/services/firebase";
import { ERROR_MESSAGE_KEY, type ErrorMessageKey } from "@/shared/constants";
import {
  AVAILABILITY_ERROR_ACTION,
  AVAILABILITY_ERROR_REASON,
} from "../constants/Availability.constants";
import type { AvailabilityErrorView } from "../models/availability.model";

const ERROR_VIEW_BY_REASON: Readonly<Record<string, AvailabilityErrorView>> =
  Object.freeze({
    [AVAILABILITY_ERROR_REASON.BUSINESS_UNAVAILABLE]: {
      action: AVAILABILITY_ERROR_ACTION.NONE,
      commonMessageKey: null,
      messageKey: "availability.errors.businessUnavailable",
    },
    [AVAILABILITY_ERROR_REASON.COLLABORATOR_UNAVAILABLE]: {
      action: AVAILABILITY_ERROR_ACTION.BACK_TO_SERVICES,
      commonMessageKey: null,
      messageKey: "availability.errors.collaboratorUnavailable",
    },
    [AVAILABILITY_ERROR_REASON.NO_COLLABORATOR]: {
      action: AVAILABILITY_ERROR_ACTION.BACK_TO_SERVICES,
      commonMessageKey: null,
      messageKey: "availability.slots.noCollaborator",
    },
    [AVAILABILITY_ERROR_REASON.NOT_CONFIGURED]: {
      action: AVAILABILITY_ERROR_ACTION.NONE,
      commonMessageKey: null,
      messageKey: "availability.slots.notConfigured",
    },
    [AVAILABILITY_ERROR_REASON.SERVICE_UNAVAILABLE]: {
      action: AVAILABILITY_ERROR_ACTION.BACK_TO_SERVICES,
      commonMessageKey: null,
      messageKey: "availability.errors.serviceUnavailable",
    },
  });

const readReason = (error: unknown): unknown => {
  if (!(error instanceof FunctionsError)) return null;
  const details: unknown = error.details;
  return typeof details === "object" && details !== null
    ? Reflect.get(details, "reason")
    : null;
};

// The Functions SDK reports a request that never reached the server as
// unavailable or internal (see FIREBASE_ERROR_CODE): both read as network.
const NETWORK_FUNCTIONS_CODES: readonly string[] = [
  FIREBASE_ERROR_CODE.FUNCTIONS_INTERNAL,
  FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE,
];

const readCommonMessageKey = (error: unknown): ErrorMessageKey => {
  if (error instanceof ZodError) return ERROR_MESSAGE_KEY.UNKNOWN;
  if (
    error instanceof FunctionsError &&
    NETWORK_FUNCTIONS_CODES.includes(error.code)
  ) {
    return ERROR_MESSAGE_KEY.NETWORK;
  }
  return mapFirebaseError(error).messageKey;
};

/**
 * Turns an error of the availability step into the message and action shown
 * (spec P5-5). A reason from the server picks its message; a malformed answer
 * is an unknown error (AC-KAN-141-03); anything else keeps the network or
 * unknown message, always with a retry (AC-KAN-140-02).
 */
export const mapAvailabilityError = (error: unknown): AvailabilityErrorView => {
  const reason = readReason(error);
  const viewByReason =
    typeof reason === "string" ? ERROR_VIEW_BY_REASON[reason] : undefined;
  if (viewByReason) return viewByReason;

  return {
    action: AVAILABILITY_ERROR_ACTION.RETRY,
    commonMessageKey: readCommonMessageKey(error),
    messageKey: null,
  };
};
