import { FunctionsError } from "firebase/functions";
import { describe, expect, it } from "vitest";
import { mapCreateBookingError } from "../utils/mapCreateBookingError";

const failedPrecondition = (reason: string): FunctionsError =>
  new FunctionsError("failed-precondition", "message", { reason });

describe("mapCreateBookingError", () => {
  it.each([
    [
      "slot_taken",
      "bookingCheckout.confirm.slotTakenError",
      "choose_another_time",
    ],
    [
      "customer_blocked",
      "bookingCheckout.confirm.customerBlockedError",
      "none",
    ],
    ["service_unavailable", "bookingCheckout.confirm.unavailableError", "none"],
    [
      "service_changed",
      "bookingCheckout.confirm.serviceChangedError",
      "reload_summary",
    ],
  ])("maps the reason %s to its message and action", (reason, key, action) => {
    expect(mapCreateBookingError(failedPrecondition(reason))).toEqual({
      action,
      commonMessageKey: null,
      messageKey: key,
    });
  });

  it("AC-KAN-148-06: a request that never reached the server is a network error", () => {
    expect(
      mapCreateBookingError(new FunctionsError("unavailable", "offline"))
        .commonMessageKey,
    ).toBe("errors.network");
  });

  it("AC-KAN-148-10: a caller who cannot book reads as permission denied", () => {
    expect(
      mapCreateBookingError(new FunctionsError("permission-denied", "no"))
        .commonMessageKey,
    ).toBe("errors.permissionDenied");
  });
});
