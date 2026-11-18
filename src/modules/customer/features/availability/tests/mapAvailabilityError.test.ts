import { FunctionsError } from "firebase/functions";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { mapAvailabilityError } from "../utils/mapAvailabilityError";

const failedPrecondition = (reason: string): FunctionsError =>
  new FunctionsError("failed-precondition", "message", { reason });

describe("mapAvailabilityError", () => {
  it.each([
    ["not_configured", "availability.slots.notConfigured", "none"],
    ["business_unavailable", "availability.errors.businessUnavailable", "none"],
    [
      "service_unavailable",
      "availability.errors.serviceUnavailable",
      "back_to_services",
    ],
    [
      "collaborator_unavailable",
      "availability.errors.collaboratorUnavailable",
      "back_to_services",
    ],
    [
      "no_collaborator",
      "availability.slots.noCollaborator",
      "back_to_services",
    ],
  ])("maps the reason %s to its message and action", (reason, key, action) => {
    expect(mapAvailabilityError(failedPrecondition(reason))).toEqual({
      action,
      commonMessageKey: null,
      messageKey: key,
    });
  });

  it("AC-KAN-140-02: a request that never reached the server is a network error with retry", () => {
    expect(
      mapAvailabilityError(new FunctionsError("unavailable", "offline")),
    ).toEqual({
      action: "retry",
      commonMessageKey: "errors.network",
      messageKey: null,
    });
  });

  it("AC-KAN-141-03: a malformed answer is an unknown error with retry", () => {
    expect(mapAvailabilityError(new ZodError([]))).toEqual({
      action: "retry",
      commonMessageKey: "errors.unknown",
      messageKey: null,
    });
  });
});
