import { FunctionsError } from "firebase/functions";
import { describe, expect, it } from "vitest";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { mapDeleteServiceError } from "../api/mapDeleteServiceError";
import { DELETE_SERVICE_ERROR_REASON } from "../constants/DeleteServiceError.constants";

describe("mapDeleteServiceError", () => {
  it("extracts must_be_inactive reason from FunctionsError details", () => {
    const functionsError = new FunctionsError(
      "failed-precondition",
      "Only inactive services can be deleted",
      { reason: DELETE_SERVICE_ERROR_REASON.MUST_BE_INACTIVE },
    );

    const result = mapDeleteServiceError(functionsError);

    expect(result.code).toBe(FIREBASE_ERROR_CODE.FAILED_PRECONDITION);
    expect(result.reason).toBe(DELETE_SERVICE_ERROR_REASON.MUST_BE_INACTIVE);
  });

  it("extracts has_active_bookings reason from FunctionsError details", () => {
    const functionsError = new FunctionsError(
      "failed-precondition",
      "The service has pending or confirmed bookings",
      { reason: DELETE_SERVICE_ERROR_REASON.HAS_ACTIVE_BOOKINGS },
    );

    const result = mapDeleteServiceError(functionsError);

    expect(result.code).toBe(FIREBASE_ERROR_CODE.FAILED_PRECONDITION);
    expect(result.reason).toBe(DELETE_SERVICE_ERROR_REASON.HAS_ACTIVE_BOOKINGS);
  });

  it("extracts business_not_active reason from FunctionsError details", () => {
    const functionsError = new FunctionsError(
      "failed-precondition",
      "The business is not active",
      { reason: DELETE_SERVICE_ERROR_REASON.BUSINESS_NOT_ACTIVE },
    );

    const result = mapDeleteServiceError(functionsError);

    expect(result.code).toBe(FIREBASE_ERROR_CODE.FAILED_PRECONDITION);
    expect(result.reason).toBe(DELETE_SERVICE_ERROR_REASON.BUSINESS_NOT_ACTIVE);
  });

  it("returns null reason when details does not include a valid reason", () => {
    const functionsError = new FunctionsError(
      "failed-precondition",
      "Generic failure",
      { reason: "unknown_reason" },
    );

    const result = mapDeleteServiceError(functionsError);

    expect(result.code).toBe(FIREBASE_ERROR_CODE.FAILED_PRECONDITION);
    expect(result.reason).toBeNull();
  });

  it("falls back gracefully when error is a standard Error", () => {
    const result = mapDeleteServiceError(new Error("Unexpected"));

    expect(result.code).toBe(FIREBASE_ERROR_CODE.UNKNOWN);
    expect(result.reason).toBeNull();
  });
});
