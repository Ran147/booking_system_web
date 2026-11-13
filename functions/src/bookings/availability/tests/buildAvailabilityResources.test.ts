import { describe, expect, it } from "vitest";
import { BOOKING_STATUS } from "../../../shared/constants/BookingStatus.constants.js";
import { buildAvailabilityResources } from "../buildAvailabilityResources.js";
import type {
  AvailabilityData,
  AvailabilityStoredBlock,
  AvailabilityStoredBooking,
} from "../models/AvailabilityData.model.js";

const SLOT_START = new Date("2026-11-20T16:00:00Z");
const SLOT_END = new Date("2026-11-20T16:30:00Z");

const buildBooking = (
  collaboratorId: AvailabilityStoredBooking["collaboratorId"],
): AvailabilityStoredBooking => ({
  collaboratorId,
  customerUserId: "customer-uid",
  endsAt: SLOT_END,
  startsAt: SLOT_START,
  status: BOOKING_STATUS.CONFIRMED,
});

const buildBlock = (
  collaboratorId: AvailabilityStoredBlock["collaboratorId"],
): AvailabilityStoredBlock => ({
  collaboratorId,
  endsAt: SLOT_END,
  startsAt: SLOT_START,
});

const buildData = (
  overrides: Partial<AvailabilityData> = {},
): AvailabilityData => ({
  activeCollaborators: [],
  blocks: [],
  bookings: [],
  hasAssignedCollaborators: false,
  ...overrides,
});

describe("buildAvailabilityResources", () => {
  it("serves a service without collaborators with the business as one resource", () => {
    const { resources } = buildAvailabilityResources(
      buildData({
        bookings: [buildBooking(null), buildBooking("collaborator-a")],
      }),
    );

    expect(resources).toHaveLength(1);
    expect(resources[0]?.id).toBeNull();
    expect(resources[0]?.bookings).toEqual([buildBooking(null)]);
  });

  it("gives each active collaborator only their own bookings and blocks", () => {
    const { businessBlocks, resources } = buildAvailabilityResources(
      buildData({
        activeCollaborators: [
          { fullName: "Ana", id: "collaborator-a" },
          { fullName: "Beto", id: "collaborator-b" },
        ],
        blocks: [buildBlock(null), buildBlock("collaborator-a")],
        bookings: [buildBooking("collaborator-b")],
        hasAssignedCollaborators: true,
      }),
    );

    expect(businessBlocks).toEqual([buildBlock(null)]);
    expect(resources.map((resource) => resource.id)).toEqual([
      "collaborator-a",
      "collaborator-b",
    ]);
    expect(resources[0]?.blocks).toEqual([buildBlock("collaborator-a")]);
    expect(resources[0]?.bookings).toEqual([]);
    expect(resources[1]?.bookings).toEqual([buildBooking("collaborator-b")]);
  });

  it("AC-KAN-142-01: with a chosen collaborator only that collaborator is a resource", () => {
    const { resources } = buildAvailabilityResources(
      buildData({
        activeCollaborators: [
          { fullName: "Ana", id: "collaborator-a" },
          { fullName: "Beto", id: "collaborator-b" },
        ],
        hasAssignedCollaborators: true,
      }),
      "collaborator-b",
    );

    expect(resources.map((resource) => resource.id)).toEqual([
      "collaborator-b",
    ]);
  });

  it("AC-KAN-144-09: a chosen collaborator who is not active and assigned gives no resource", () => {
    const withCollaborators = buildAvailabilityResources(
      buildData({
        activeCollaborators: [{ fullName: "Ana", id: "collaborator-a" }],
        hasAssignedCollaborators: true,
      }),
      "collaborator-inactive",
    );
    const withoutCollaborators = buildAvailabilityResources(
      buildData(),
      "collaborator-a",
    );

    expect(withCollaborators.resources).toEqual([]);
    expect(withoutCollaborators.resources).toEqual([]);
  });

  it("AC-KAN-141-10: assigned collaborators that are all inactive give no resource", () => {
    const { resources } = buildAvailabilityResources(
      buildData({ activeCollaborators: [], hasAssignedCollaborators: true }),
    );

    expect(resources).toEqual([]);
  });
});
