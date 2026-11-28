import { FunctionsError } from "firebase/functions";
import { ERROR_MESSAGE_KEY, FIREBASE_ERROR_CODE } from "@/constants";
import { mapFirebaseError } from "@/services/firebase";
import type { Nullable } from "@/types";
import {
  PLAN_CHECKOUT_ERROR_REASON,
  type PlanCheckoutErrorReason,
} from "../constants/PlanCheckout.constants";
import type { PlanCheckoutFunctionError } from "../models/PlanCheckoutFunctionError.interface";

const DETAILS_FIELD = Object.freeze({
  CURRENT_PRICE_IN_CENTS: "currentPriceInCents",
  REASON: "reason",
} as const);

const isPlanCheckoutErrorReason = (
  reason: unknown,
): reason is PlanCheckoutErrorReason =>
  Object.values(PLAN_CHECKOUT_ERROR_REASON).some(
    (planCheckoutErrorReason) => planCheckoutErrorReason === reason,
  );

const readDetailsField = (error: unknown, field: string): unknown => {
  if (!(error instanceof FunctionsError)) return null;
  const { details } = error;
  if (typeof details !== "object" || details === null) return null;
  return Reflect.get(details, field);
};

const readErrorReason = (error: unknown): Nullable<PlanCheckoutErrorReason> => {
  const reason = readDetailsField(error, DETAILS_FIELD.REASON);
  return isPlanCheckoutErrorReason(reason) ? reason : null;
};

const readCurrentPriceInCents = (error: unknown): Nullable<number> => {
  const currentPriceInCents = readDetailsField(
    error,
    DETAILS_FIELD.CURRENT_PRICE_IN_CENTS,
  );
  return typeof currentPriceInCents === "number" &&
    Number.isInteger(currentPriceInCents)
    ? currentPriceInCents
    : null;
};

// Converts a payPlanCheckout error once, at the api/ boundary
// (api-mutation-standards §3). An offline browser and functions/unavailable
// (the server could not check the reCAPTCHA with Google) are both reported as
// a network error, so the visitor retries the same attempt (AC-KAN-22-09).
export const mapPlanCheckoutFunctionError = (
  error: unknown,
): PlanCheckoutFunctionError => {
  const mutationError = mapFirebaseError(error);
  const isNetworkError =
    !navigator.onLine ||
    mutationError.code === FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE;
  return {
    ...mutationError,
    currentPriceInCents: readCurrentPriceInCents(error),
    messageKey: isNetworkError
      ? ERROR_MESSAGE_KEY.NETWORK
      : mutationError.messageKey,
    reason: readErrorReason(error),
  };
};
