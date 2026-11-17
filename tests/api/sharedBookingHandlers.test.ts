// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { callServerFunction } from "./bookingTestHelpers";
import { CallableFailure } from "../../functions/src/shared/CallableFailure.js";

// The dispatcher runs the shared handlers of functions/src for customers (Q8).
// The handlers have their own emulator tests; here they are replaced to check
// what the dispatcher sends them and how it answers.
const handlerFake = vi.hoisted(() => ({
  handleCreateBooking: vi.fn(),
  handleGetAvailability: vi.fn(),
}));

vi.mock(
  "../../functions/src/bookings/handlers/handleGetAvailability.js",
  () => ({
    handleGetAvailability: handlerFake.handleGetAvailability,
  }),
);

vi.mock("../../functions/src/bookings/handlers/handleCreateBooking.js", () => ({
  handleCreateBooking: handlerFake.handleCreateBooking,
}));

vi.mock("firebase-admin/app", () => ({
  cert: vi.fn(),
  getApps: (): object[] => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: (): object => ({}),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: (): object => ({}),
  Timestamp: { now: (): Date => new Date() },
}));

const CUSTOMER_UID = "customer-42";
const CUSTOMER_TOKEN = `test-customer-token:${CUSTOMER_UID}`;
const AVAILABILITY_PAYLOAD = {
  businessId: "business-1",
  date: "2026-11-20",
  serviceId: "service-1",
};

describe("Vercel dispatcher: shared booking handlers (Q8)", () => {
  beforeEach((): void => {
    handlerFake.handleGetAvailability.mockReset();
    handlerFake.handleCreateBooking.mockReset();
  });

  it("KAN-140: runs getAvailability for a customer with the uid of the token", async () => {
    const answer = { date: "2026-11-20", slots: [], timeZone: "UTC" };
    handlerFake.handleGetAvailability.mockResolvedValue(answer);

    const result = await callServerFunction(
      "getAvailability",
      AVAILABILITY_PAYLOAD,
      CUSTOMER_TOKEN,
    );

    expect(result).toEqual({ body: answer, statusCode: 200 });
    expect(handlerFake.handleGetAvailability).toHaveBeenCalledWith(
      expect.objectContaining({
        caller: { role: "customer", uid: CUSTOMER_UID },
        payload: AVAILABILITY_PAYLOAD,
      }),
    );
  });

  it("AS-8: getAvailability is only for customers", async () => {
    const visitor = await callServerFunction(
      "getAvailability",
      AVAILABILITY_PAYLOAD,
      "",
    );
    const subscriber = await callServerFunction(
      "getAvailability",
      AVAILABILITY_PAYLOAD,
    );

    expect(visitor.statusCode).toBe(401);
    expect(subscriber.statusCode).toBe(403);
    expect(handlerFake.handleGetAvailability).not.toHaveBeenCalled();
  });

  it("answers a CallableFailure with its code, message and details, like a callable", async () => {
    handlerFake.handleGetAvailability.mockRejectedValue(
      new CallableFailure(
        "failed-precondition",
        "customer:availability.slots.notConfigured",
        { reason: "not_configured" },
      ),
    );

    const result = await callServerFunction(
      "getAvailability",
      AVAILABILITY_PAYLOAD,
      CUSTOMER_TOKEN,
    );

    expect(result).toEqual({
      body: {
        code: "failed-precondition",
        details: { reason: "not_configured" },
        error: "failed-precondition",
        message: "customer:availability.slots.notConfigured",
      },
      statusCode: 412,
    });
  });

  it("KAN-144: a customer books through the shared handler, whatever customerId says", async () => {
    handlerFake.handleCreateBooking.mockResolvedValue({
      bookingId: "booking-1",
      serviceSnapshot: { durationMinutes: 30, name: "Corte", priceInCents: 1 },
      status: "confirmed",
    });
    const payload = {
      businessId: "business-1",
      customerId: "someone-else",
      serviceId: "service-1",
      startsAt: "2026-11-20T15:00:00.000Z",
    };

    const result = await callServerFunction(
      "createBooking",
      payload,
      CUSTOMER_TOKEN,
    );

    expect(result.statusCode).toBe(200);
    expect(result.body.bookingId).toBe("booking-1");
    expect(handlerFake.handleCreateBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        caller: { role: "customer", uid: CUSTOMER_UID },
        payload,
      }),
    );
  });

  it("KAN-144: a taken slot answers 412 with slot_taken", async () => {
    handlerFake.handleCreateBooking.mockRejectedValue(
      new CallableFailure(
        "failed-precondition",
        "customer:bookingCheckout.confirm.slotTakenError",
        { reason: "slot_taken" },
      ),
    );

    const result = await callServerFunction(
      "createBooking",
      { businessId: "business-1" },
      CUSTOMER_TOKEN,
    );

    expect(result.statusCode).toBe(412);
    expect(result.body.details).toEqual({ reason: "slot_taken" });
  });
});
