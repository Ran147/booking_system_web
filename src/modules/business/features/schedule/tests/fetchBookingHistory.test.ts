import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBookingHistory } from "../api/fetchBookingHistory";

const mockDocs: Array<{ ["data"]: () => Record<string, unknown>; id: string }> =
  [];

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  getDocs: vi.fn(async () => ({
    docs: mockDocs,
  })),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
}));

vi.mock("@/services/firebase", () => ({
  firestore: {},
}));

describe("fetchBookingHistory (KAN-76)", () => {
  const businessId = "business-123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocs.length = 0;

    // Base mock bookings:
    // 1. Past completed booking on 2026-11-05
    mockDocs.push({
      ["data"]: () => ({
        businessId,
        collaboratorId: "collab-1",
        customerId: "cust-1",
        endsAt: new Date("2026-11-05T15:00:00.000Z"),
        serviceId: "service-haircut",
        serviceSnapshot: {
          durationMinutes: 30,
          name: "Corte",
          priceInCents: 1000,
        },
        startsAt: new Date("2026-11-05T14:30:00.000Z"),
        status: "completed",
      }),
      id: "booking-1",
    });

    // 2. Future cancelled booking on 2026-11-10
    mockDocs.push({
      ["data"]: () => ({
        businessId,
        collaboratorId: "collab-2",
        customerId: "cust-2",
        endsAt: new Date("2026-11-10T16:00:00.000Z"),
        serviceId: "service-beard",
        serviceSnapshot: {
          durationMinutes: 30,
          name: "Barba",
          priceInCents: 800,
        },
        startsAt: new Date("2026-11-10T15:30:00.000Z"),
        status: "cancelled",
      }),
      id: "booking-2",
    });

    // 3. Past confirmed booking on 2026-11-01
    mockDocs.push({
      ["data"]: () => ({
        businessId,
        collaboratorId: "collab-1",
        customerId: "cust-3",
        endsAt: new Date("2026-11-01T17:00:00.000Z"),
        serviceId: "service-haircut",
        serviceSnapshot: {
          durationMinutes: 30,
          name: "Corte",
          priceInCents: 1000,
        },
        startsAt: new Date("2026-11-01T16:30:00.000Z"),
        status: "confirmed",
      }),
      id: "booking-3",
    });
  });

  it("AC-KAN-76-01: returns all historical bookings (past and terminal status)", async () => {
    const result = await fetchBookingHistory(businessId, { status: "all" });

    expect(result.totalCount).toBe(3);
    expect(result.bookings).toHaveLength(3);
  });

  it("AC-KAN-76-02: filters by status correctly", async () => {
    const result = await fetchBookingHistory(businessId, {
      status: "cancelled",
    });

    expect(result.totalCount).toBe(1);
    expect(result.bookings[0]?.id).toBe("booking-2");
  });

  it("AC-KAN-76-02: filters by serviceId correctly", async () => {
    const result = await fetchBookingHistory(businessId, {
      serviceId: "service-beard",
      status: "all",
    });

    expect(result.totalCount).toBe(1);
    expect(result.bookings[0]?.id).toBe("booking-2");
  });

  it("AC-KAN-76-02: filters by date range in Costa Rica time", async () => {
    const result = await fetchBookingHistory(
      businessId,
      {
        endDate: "2026-11-06",
        startDate: "2026-11-04",
        status: "all",
      },
      10,
      "America/Costa_Rica",
    );

    expect(result.totalCount).toBe(1);
    expect(result.bookings[0]?.id).toBe("booking-1");
  });

  it("AC-KAN-76-02: filters by single date in Costa Rica time", async () => {
    const result = await fetchBookingHistory(
      businessId,
      {
        date: "2026-11-05",
        status: "all",
      },
      10,
      "America/Costa_Rica",
    );

    expect(result.totalCount).toBe(1);
    expect(result.bookings[0]?.id).toBe("booking-1");
  });

  it("AC-KAN-76-03: does not apply date filter when end date is before start date", async () => {
    const result = await fetchBookingHistory(
      businessId,
      {
        endDate: "2026-11-01",
        startDate: "2026-11-10",
        status: "all",
      },
      10,
      "America/Costa_Rica",
    );

    // Filter was skipped per AC-KAN-76-03
    expect(result.totalCount).toBe(3);
  });
});
