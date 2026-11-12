import { describe, expect, it } from "vitest";
import { BOOKING_STATUS } from "../../../shared/constants/BookingStatus.constants.js";
import type { AvailabilityStoredBooking } from "../models/AvailabilityData.model.js";
import { selectCollaborator } from "../selectCollaborator.js";

const COSTA_RICA_TIME_ZONE = "America/Costa_Rica";
const BOOKING_DATE = "2026-11-20";
const COLLABORATORS = [
  { fullName: "Carla", id: "collaborator-c" },
  { fullName: "Ana", id: "collaborator-a" },
  { fullName: "Beto", id: "collaborator-b" },
];

// 2026-11-20 10:00 in Costa Rica (UTC-6) is 16:00 UTC.
const buildBooking = (
  collaboratorId: string,
  startsAt = "2026-11-20T16:00:00Z",
  status: AvailabilityStoredBooking["status"] = BOOKING_STATUS.CONFIRMED,
): AvailabilityStoredBooking => ({
  collaboratorId,
  customerUserId: "someone",
  endsAt: new Date(new Date(startsAt).getTime() + 1_800_000),
  startsAt: new Date(startsAt),
  status,
});

const select = (
  bookings: readonly AvailabilityStoredBooking[],
  freeCollaboratorIds: readonly string[] = COLLABORATORS.map(
    (collaborator) => collaborator.id,
  ),
): ReturnType<typeof selectCollaborator> =>
  selectCollaborator({
    bookings,
    collaborators: COLLABORATORS,
    date: BOOKING_DATE,
    freeCollaboratorIds,
    timeZone: COSTA_RICA_TIME_ZONE,
  });

describe("selectCollaborator", () => {
  it("AC-KAN-144-08: picks the free collaborator with the fewest bookings that day", () => {
    const selected = select([
      buildBooking("collaborator-a"),
      buildBooking("collaborator-a", "2026-11-20T18:00:00Z"),
      buildBooking("collaborator-b"),
    ]);

    expect(selected?.id).toBe("collaborator-c");
  });

  it("AC-KAN-144-08: breaks a tie with the first collaborator by name", () => {
    expect(select([])?.id).toBe("collaborator-a");
  });

  it("AC-KAN-144-08: only counts open bookings of that local day", () => {
    const selected = select([
      buildBooking(
        "collaborator-a",
        "2026-11-20T16:00:00Z",
        BOOKING_STATUS.CANCELLED,
      ),
      buildBooking("collaborator-a", "2026-11-21T16:00:00Z"),
      buildBooking("collaborator-b"),
    ]);

    expect(selected?.id).toBe("collaborator-a");
  });

  it("only considers the free collaborators", () => {
    expect(select([], ["collaborator-c"])?.id).toBe("collaborator-c");
  });

  it("returns null when nobody is free", () => {
    expect(select([], [])).toBeNull();
  });
});
