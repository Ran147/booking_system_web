import { describe, expect, it } from "vitest";
import { BOOKING_STATUS } from "../../../shared/constants/BookingStatus.constants.js";
import { computeFreeSlots } from "../computeFreeSlots.js";
import type {
  AvailabilityBlock,
  AvailabilityBooking,
  AvailabilityResource,
  ComputeFreeSlotsInput,
} from "../models/Availability.model.js";

// 2026-11-10 is a Tuesday. Costa Rica is UTC-6 all year (no daylight saving).
const BUSINESS_DATE = "2026-11-10";
const COSTA_RICA_OFFSET_HOURS = 6;
const COSTA_RICA_TIME_ZONE = "America/Costa_Rica";
const NEW_YORK_TIME_ZONE = "America/New_York";
const BEFORE_DAYLIGHT_SAVING_NOW = new Date("2026-01-01T00:00:00Z");
const EARLY_MORNING_NOW = new Date("2026-11-09T12:00:00Z");

const costaRicaInstant = (time: string): Date => {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return new Date(
    Date.UTC(2026, 10, 10, hour + COSTA_RICA_OFFSET_HOURS, minute),
  );
};

const buildBooking = (
  startsAtTime: string,
  endsAtTime: string,
  status: AvailabilityBooking["status"] = BOOKING_STATUS.CONFIRMED,
): AvailabilityBooking => ({
  endsAt: costaRicaInstant(endsAtTime),
  startsAt: costaRicaInstant(startsAtTime),
  status,
});

const buildBlock = (
  startsAtTime: string,
  endsAtTime: string,
): AvailabilityBlock => ({
  endsAt: costaRicaInstant(endsAtTime),
  startsAt: costaRicaInstant(startsAtTime),
});

const buildResource = (
  id: AvailabilityResource["id"],
  overrides: Partial<AvailabilityResource> = {},
): AvailabilityResource => ({ blocks: [], bookings: [], id, ...overrides });

const TUESDAY_WITH_BREAK = {
  tuesday: [
    { closesAt: "12:00", opensAt: "09:00" },
    { closesAt: "17:00", opensAt: "13:00" },
  ],
};

const buildInput = (
  overrides: Partial<ComputeFreeSlotsInput> = {},
): ComputeFreeSlotsInput => ({
  businessBlocks: [],
  businessHours: TUESDAY_WITH_BREAK,
  date: BUSINESS_DATE,
  durationMinutes: 30,
  now: EARLY_MORNING_NOW,
  resources: [buildResource(null)],
  timeZone: COSTA_RICA_TIME_ZONE,
  ...overrides,
});

// Start times as Costa Rica wall-clock text, to read the expectations easily.
const readLocalStartTimes = (input: ComputeFreeSlotsInput): string[] =>
  computeFreeSlots(input).map((slot) => {
    const localHour = slot.startsAt.getUTCHours() - COSTA_RICA_OFFSET_HOURS;
    const minute = String(slot.startsAt.getUTCMinutes()).padStart(2, "0");
    return `${String(localHour).padStart(2, "0")}:${minute}`;
  });

describe("computeFreeSlots", () => {
  describe("KAN-141: free slots of a day", () => {
    it("AC-KAN-141-01: generates a slot every 30 minutes that fits before the range closes", () => {
      const startTimes = readLocalStartTimes(
        buildInput({
          businessHours: { tuesday: [{ closesAt: "12:00", opensAt: "09:00" }] },
          durationMinutes: 45,
        }),
      );

      expect(startTimes).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
    });

    it("AC-KAN-141-05: keeps a slot that ends exactly when the range closes", () => {
      const startTimes = readLocalStartTimes(
        buildInput({
          businessHours: { tuesday: [{ closesAt: "10:00", opensAt: "09:00" }] },
        }),
      );

      expect(startTimes).toEqual(["09:00", "09:30"]);
    });

    it("AC-KAN-141-05: returns no slot when the service does not fit in any range", () => {
      const slots = computeFreeSlots(buildInput({ durationMinutes: 300 }));

      expect(slots).toEqual([]);
    });

    it("KAN-139 D-1: treats the gap between two ranges as a break", () => {
      const startTimes = readLocalStartTimes(buildInput());

      expect(startTimes).not.toContain("12:00");
      expect(startTimes).not.toContain("12:30");
      expect(startTimes).toContain("11:30");
      expect(startTimes).toContain("13:00");
    });

    it("AC-KAN-141-04: drops the slots that start before now and keeps the one that starts at now", () => {
      const startTimes = readLocalStartTimes(
        buildInput({ now: costaRicaInstant("10:30") }),
      );

      expect(startTimes[0]).toBe("10:30");
      expect(startTimes).not.toContain("10:00");
    });

    it("AC-KAN-141-04: returns no slot when the whole day is already in the past", () => {
      const slots = computeFreeSlots(
        buildInput({ now: costaRicaInstant("18:00") }),
      );

      expect(slots).toEqual([]);
    });

    it("AC-KAN-141-06: ignores cancelled, completed and no-show bookings", () => {
      const resource = buildResource(null, {
        bookings: [
          buildBooking("10:00", "10:30", BOOKING_STATUS.CANCELLED),
          buildBooking("10:30", "11:00", BOOKING_STATUS.COMPLETED),
          buildBooking("11:00", "11:30", BOOKING_STATUS.NO_SHOW),
        ],
      });

      const startTimes = readLocalStartTimes(
        buildInput({ resources: [resource] }),
      );

      expect(startTimes).toEqual(
        expect.arrayContaining(["10:00", "10:30", "11:00"]),
      );
    });

    it("AC-KAN-141-06: counts pending bookings as taken", () => {
      const resource = buildResource(null, {
        bookings: [buildBooking("10:00", "10:30", BOOKING_STATUS.PENDING)],
      });

      const startTimes = readLocalStartTimes(
        buildInput({ resources: [resource] }),
      );

      expect(startTimes).not.toContain("10:00");
    });

    it("AC-KAN-141-07: skips a start time that does not exist when the clocks jump forward", () => {
      const slots = computeFreeSlots(
        buildInput({
          businessHours: { sunday: [{ closesAt: "04:00", opensAt: "01:00" }] },
          date: "2026-03-08",
          now: BEFORE_DAYLIGHT_SAVING_NOW,
          timeZone: NEW_YORK_TIME_ZONE,
        }),
      );

      expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
        "2026-03-08T06:00:00.000Z",
        "2026-03-08T06:30:00.000Z",
        "2026-03-08T07:00:00.000Z",
        "2026-03-08T07:30:00.000Z",
      ]);
    });

    it("AC-KAN-141-07: offers a repeated start time once when the clocks go back", () => {
      const slots = computeFreeSlots(
        buildInput({
          businessHours: { sunday: [{ closesAt: "03:00", opensAt: "01:00" }] },
          date: "2026-11-01",
          now: BEFORE_DAYLIGHT_SAVING_NOW,
          timeZone: NEW_YORK_TIME_ZONE,
        }),
      );

      expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
        "2026-11-01T05:00:00.000Z",
        "2026-11-01T05:30:00.000Z",
        "2026-11-01T07:00:00.000Z",
        "2026-11-01T07:30:00.000Z",
      ]);
    });

    it("AC-KAN-141-09: returns a slot when at least one resource is free", () => {
      const busyCollaborator = buildResource("collaborator-a", {
        bookings: [buildBooking("10:00", "10:30")],
      });
      const freeCollaborator = buildResource("collaborator-b");

      const slot = computeFreeSlots(
        buildInput({ resources: [busyCollaborator, freeCollaborator] }),
      ).find(
        (candidate) =>
          candidate.startsAt.getTime() === costaRicaInstant("10:00").getTime(),
      );

      expect(slot?.freeResourceIds).toEqual(["collaborator-b"]);
    });

    it("AC-KAN-141-09: drops a slot when every resource is busy", () => {
      const resources = [
        buildResource("collaborator-a", {
          bookings: [buildBooking("10:00", "10:30")],
        }),
        buildResource("collaborator-b", {
          bookings: [buildBooking("10:00", "10:30")],
        }),
      ];

      const startTimes = readLocalStartTimes(buildInput({ resources }));

      expect(startTimes).not.toContain("10:00");
      expect(startTimes).toContain("09:30");
    });

    it("AC-KAN-141-10: returns no slot when the service has no resource", () => {
      const slots = computeFreeSlots(buildInput({ resources: [] }));

      expect(slots).toEqual([]);
    });
  });

  describe("KAN-142: collaborator choice", () => {
    it("AC-KAN-142-01: with one resource only that resource decides the slots", () => {
      const chosenCollaborator = buildResource("collaborator-a", {
        bookings: [buildBooking("09:00", "10:00")],
      });

      const startTimes = readLocalStartTimes(
        buildInput({ resources: [chosenCollaborator] }),
      );

      expect(startTimes).not.toContain("09:00");
      expect(startTimes).not.toContain("09:30");
      expect(startTimes).toContain("10:00");
    });

    it("AC-KAN-142-02: lists every free resource per slot for the server to assign", () => {
      const slots = computeFreeSlots(
        buildInput({
          resources: [
            buildResource("collaborator-a"),
            buildResource("collaborator-b"),
          ],
        }),
      );

      expect(slots[0]?.freeResourceIds).toEqual([
        "collaborator-a",
        "collaborator-b",
      ]);
    });

    it("uses the business itself as the resource when the id is null", () => {
      const slots = computeFreeSlots(buildInput());

      expect(slots[0]?.freeResourceIds).toEqual([null]);
    });
  });

  describe("KAN-143: bookings and blocks", () => {
    it("AC-KAN-143-01: removes every slot that overlaps an open booking, even in part", () => {
      const resource = buildResource(null, {
        bookings: [buildBooking("10:00", "10:45")],
      });

      const startTimes = readLocalStartTimes(
        buildInput({ durationMinutes: 45, resources: [resource] }),
      );

      expect(startTimes).toContain("09:00");
      expect(startTimes).not.toContain("09:30");
      expect(startTimes).not.toContain("10:00");
      expect(startTimes).not.toContain("10:30");
      expect(startTimes).toContain("11:00");
    });

    it("AC-KAN-143-01: keeps slots that only touch a booking edge", () => {
      const resource = buildResource(null, {
        bookings: [buildBooking("10:00", "10:30")],
      });

      const startTimes = readLocalStartTimes(
        buildInput({ resources: [resource] }),
      );

      expect(startTimes).toContain("09:30");
      expect(startTimes).toContain("10:30");
    });

    it("AC-KAN-143-03: returns no slot on a day without opening ranges", () => {
      const closedDays = [
        { tuesday: [] },
        { tuesday: null },
        { monday: [{ closesAt: "17:00", opensAt: "09:00" }] },
      ];

      for (const businessHours of closedDays) {
        expect(computeFreeSlots(buildInput({ businessHours }))).toEqual([]);
      }
    });

    it("AC-KAN-143-06: a partial block cuts the slots it touches", () => {
      const startTimes = readLocalStartTimes(
        buildInput({ businessBlocks: [buildBlock("10:15", "10:45")] }),
      );

      expect(startTimes).toContain("09:30");
      expect(startTimes).not.toContain("10:00");
      expect(startTimes).not.toContain("10:30");
      expect(startTimes).toContain("11:00");
    });

    it("AC-KAN-143-06: a block of the whole business applies to every resource", () => {
      const slots = computeFreeSlots(
        buildInput({
          businessBlocks: [buildBlock("00:00", "23:59")],
          resources: [
            buildResource("collaborator-a"),
            buildResource("collaborator-b"),
          ],
        }),
      );

      expect(slots).toEqual([]);
    });

    it("AC-KAN-143-06: a block of one collaborator leaves the others free", () => {
      const slots = computeFreeSlots(
        buildInput({
          resources: [
            buildResource("collaborator-a", {
              blocks: [buildBlock("00:00", "23:59")],
            }),
            buildResource("collaborator-b"),
          ],
        }),
      );

      expect(slots[0]?.freeResourceIds).toEqual(["collaborator-b"]);
    });
  });

  describe("shape of the result", () => {
    it("returns the slots ordered by start even when the ranges are listed out of order", () => {
      const startTimes = readLocalStartTimes(
        buildInput({
          businessHours: {
            tuesday: [
              { closesAt: "15:00", opensAt: "14:00" },
              { closesAt: "10:00", opensAt: "09:00" },
            ],
          },
        }),
      );

      expect(startTimes).toEqual(["09:00", "09:30", "14:00", "14:30"]);
    });

    it("never repeats a start time when two ranges overlap", () => {
      const startTimes = readLocalStartTimes(
        buildInput({
          businessHours: {
            tuesday: [
              { closesAt: "11:00", opensAt: "09:00" },
              { closesAt: "12:00", opensAt: "10:00" },
            ],
          },
        }),
      );

      expect(startTimes).toEqual([
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
      ]);
    });

    it("sets each slot end from the service duration", () => {
      const [firstSlot] = computeFreeSlots(buildInput({ durationMinutes: 45 }));

      expect(firstSlot?.endsAt.getTime()).toBe(
        costaRicaInstant("09:45").getTime(),
      );
    });
  });
});
