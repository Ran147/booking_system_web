import { FunctionsError } from "firebase/functions";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { mapFirebaseError } from "@/services/firebase";
import { ERROR_MESSAGE_KEY, type ErrorMessageKey } from "@/shared/constants";
import {
  CHECKOUT_ERROR_ACTION,
  CHECKOUT_ERROR_REASON,
} from "../constants/BookingCheckout.constants";
import type { CheckoutErrorView } from "../models/bookingCheckout.model";

const ERROR_VIEW_BY_REASON: Readonly<Record<string, CheckoutErrorView>> =
  Object.freeze({
    [CHECKOUT_ERROR_REASON.CUSTOMER_BLOCKED]: {
      action: CHECKOUT_ERROR_ACTION.NONE,
      commonMessageKey: null,
      messageKey: "bookingCheckout.confirm.customerBlockedError",
    },
    [CHECKOUT_ERROR_REASON.SERVICE_CHANGED]: {
      action: CHECKOUT_ERROR_ACTION.RELOAD_SUMMARY,
      commonMessageKey: null,
      messageKey: "bookingCheckout.confirm.serviceChangedError",
    },
    [CHECKOUT_ERROR_REASON.SERVICE_UNAVAILABLE]: {
      action: CHECKOUT_ERROR_ACTION.NONE,
      commonMessageKey: null,
      messageKey: "bookingCheckout.confirm.unavailableError",
    },
    [CHECKOUT_ERROR_REASON.SLOT_TAKEN]: {
      action: CHECKOUT_ERROR_ACTION.CHOOSE_ANOTHER_TIME,
      commonMessageKey: null,
      messageKey: "bookingCheckout.confirm.slotTakenError",
    },
  });

// A request that never reached the server reads as network (see
// FIREBASE_ERROR_CODE); a role that cannot book reads as permission denied.
const NETWORK_FUNCTIONS_CODES: readonly string[] = [
  FIREBASE_ERROR_CODE.FUNCTIONS_INTERNAL,
  FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE,
];

const readCommonMessageKey = (error: unknown): ErrorMessageKey => {
  if (!(error instanceof FunctionsError)) {
    return mapFirebaseError(error).messageKey;
  }
  if (NETWORK_FUNCTIONS_CODES.includes(error.code)) {
    return ERROR_MESSAGE_KEY.NETWORK;
  }
  if (error.code === FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED) {
    return ERROR_MESSAGE_KEY.PERMISSION_DENIED;
  }
  return mapFirebaseError(error).messageKey;
};

const readReason = (error: unknown): unknown => {
  if (!(error instanceof FunctionsError)) return null;
  const details: unknown = error.details;
  return typeof details === "object" && details !== null
    ? Reflect.get(details, "reason")
    : null;
};

/** A confirmation error → message and action (spec KAN-145, C-5). */
export const mapCreateBookingError = (error: unknown): CheckoutErrorView => {
  const reason = readReason(error);
  const viewByReason =
    typeof reason === "string" ? ERROR_VIEW_BY_REASON[reason] : undefined;
  if (viewByReason) return viewByReason;

  return {
    action: CHECKOUT_ERROR_ACTION.NONE,
    commonMessageKey: readCommonMessageKey(error),
    messageKey: null,
  };
};
