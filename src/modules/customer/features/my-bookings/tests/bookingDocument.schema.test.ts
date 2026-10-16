import type { DocumentSnapshot } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { BOOKING_STATUS, CANCELLATION_ACTOR } from "@/domain";
import { mapMyBooking } from "../api/bookingDocument.schema";

const STARTS_AT = new Date("2026-11-02T16:00:00.000Z");
const ENDS_AT = new Date("2026-11-02T16:45:00.000Z");
const DOCUMENT_DATA_KEY = "data";

const buildDocument = (
  overrides: Record<string, unknown> = {},
): DocumentSnapshot =>
  ({
    [DOCUMENT_DATA_KEY]: () => ({
      businessId: "business-a",
      cancellation: null,
      collaboratorName: "Carlos Colaborador",
      endsAt: { toDate: () => ENDS_AT },
      serviceSnapshot: {
        durationMinutes: 45,
        name: "Corte de cabello",
        priceInCents: 25_000,
      },
      startsAt: { toDate: () => STARTS_AT },
      status: BOOKING_STATUS.CONFIRMED,
      ...overrides,
    }),
    id: "booking-1",
  }) as unknown as DocumentSnapshot;

describe("mapMyBooking (KAN-150)", () => {
  it("converts timestamps to dates and reads the service snapshot (AC-KAN-152-06)", () => {
    expect(mapMyBooking(buildDocument())).toEqual({
      businessId: "business-a",
      cancellation: null,
      collaboratorName: "Carlos Colaborador",
      durationMinutes: 45,
      endsAt: ENDS_AT,
      id: "booking-1",
      priceInCents: 25_000,
      serviceName: "Corte de cabello",
      startsAt: STARTS_AT,
      status: BOOKING_STATUS.CONFIRMED,
    });
  });

  it("never exposes the internal cancellation note (AS-4)", () => {
    const booking = mapMyBooking(
      buildDocument({
        cancellation: {
          cancelledBy: CANCELLATION_ACTOR.BUSINESS,
          isPenalized: true,
          note: "Internal note",
        },
        status: BOOKING_STATUS.CANCELLED,
      }),
    );

    expect(booking.cancellation).toEqual({
      cancelledBy: CANCELLATION_ACTOR.BUSINESS,
      isPenalized: true,
    });
  });

  it("reads a missing collaborator name as null (AC-KAN-152-07)", () => {
    const booking = mapMyBooking(
      buildDocument({ collaboratorName: undefined }),
    );

    expect(booking.collaboratorName).toBeNull();
  });

  it("rejects a document with an unknown status", () => {
    expect(() => mapMyBooking(buildDocument({ status: "unknown" }))).toThrow();
  });
});
