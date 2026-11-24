import {
  Timestamp,
  type CollectionReference,
  type DocumentReference,
} from "firebase-admin/firestore";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BOOKING_STATUS } from "../../shared/constants/BookingStatus.constants.js";
import { COLLABORATOR_STATUS } from "../../shared/constants/CollaboratorStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { SERVICE_STATUS } from "../../shared/constants/ServiceStatus.constants.js";
import { USER_ROLE } from "../../shared/constants/UserRole.constants.js";
import { firestore } from "../../shared/firebaseAdmin.js";
import {
  assertEmulatorsRunning,
  buildAuthenticatedCallableRequest,
  captureHttpsError,
  clearEmulators,
  functionsTestEnvironment,
} from "../../shared/tests/emulatorTestHelpers.js";
import type { Nullable } from "../../shared/types/Nullable.js";
import {
  formatZonedDate,
  resolveZonedInstant,
} from "../../shared/zonedTime.js";
import { createBooking } from "../createBooking.js";

// KAN-144: the server re-checks the slot inside the booking transaction.
const callCreateBooking = functionsTestEnvironment.wrap(createBooking);

const BUSINESS_ID = "business-revalidation";
const SERVICE_ID = "service-cut";
const SERVICE_DURATION_MINUTES = 30;
const SLOT_TAKEN_MESSAGE = "customer:bookingCheckout.confirm.slotTakenError";
const COSTA_RICA_TIME_ZONE = "America/Costa_Rica";
const MS_PER_DAY = 86_400_000;
const MS_PER_MINUTE = 60_000;
const BOOKING_DAYS_AHEAD = 2;
const BOOKING_DATE = formatZonedDate(
  new Date(Date.now() + BOOKING_DAYS_AHEAD * MS_PER_DAY),
  COSTA_RICA_TIME_ZONE,
);
const OPEN_EVERY_DAY = Object.fromEntries(
  [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ].map((weekday) => [weekday, [{ closesAt: "18:00", opensAt: "08:00" }]]),
);

const slotAt = (time: string): Date =>
  resolveZonedInstant(BOOKING_DATE, time, COSTA_RICA_TIME_ZONE) as Date;

const SETTLED_STATUS = Object.freeze({ FULFILLED: "fulfilled" } as const);

const customerAuth = (
  userId: string,
): { token: { role: string }; uid: string } => ({
  token: { role: USER_ROLE.CUSTOMER },
  uid: userId,
});

const businessReference = (): DocumentReference =>
  firestore.collection(FIRESTORE_COLLECTION.BUSINESSES).doc(BUSINESS_ID);

const bookingsCollection = (): CollectionReference =>
  businessReference().collection(FIRESTORE_COLLECTION.BOOKINGS);

const requestBooking = (
  startsAt: Date,
  userId = "customer-1",
  extraPayload: Record<string, unknown> = {},
): ReturnType<typeof callCreateBooking> =>
  callCreateBooking(
    buildAuthenticatedCallableRequest(
      {
        businessId: BUSINESS_ID,
        serviceId: SERVICE_ID,
        startsAt: startsAt.toISOString(),
        ...extraPayload,
      },
      customerAuth(userId),
    ),
  );

const addCollaborator = async (
  collaboratorId: string,
  fullName: string,
  status: string = COLLABORATOR_STATUS.ACTIVE,
): Promise<void> => {
  await businessReference()
    .collection(FIRESTORE_COLLECTION.COLLABORATORS)
    .doc(collaboratorId)
    .set({ fullName, serviceIds: [SERVICE_ID], status });
};

const addBooking = async (
  startsAt: Date,
  collaboratorId: Nullable<string> = null,
  status: string = BOOKING_STATUS.CONFIRMED,
): Promise<void> => {
  await bookingsCollection().add({
    collaboratorId,
    customerUserId: "someone-else",
    endsAt: Timestamp.fromDate(
      new Date(startsAt.getTime() + SERVICE_DURATION_MINUTES * MS_PER_MINUTE),
    ),
    startsAt: Timestamp.fromDate(startsAt),
    status,
  });
};

const addBlock = async (
  startsAt: Date,
  endsAt: Date,
  collaboratorId: Nullable<string> = null,
): Promise<void> => {
  await businessReference()
    .collection(FIRESTORE_COLLECTION.SCHEDULE_BLOCKS)
    .add({
      collaboratorId,
      endsAt: Timestamp.fromDate(endsAt),
      isFullDay: false,
      reason: null,
      startsAt: Timestamp.fromDate(startsAt),
    });
};

const countBookings = async (): Promise<number> =>
  (await bookingsCollection().get()).size;

describe("createBooking re-validation (KAN-144)", () => {
  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();
    await businessReference().set({
      businessHours: OPEN_EVERY_DAY,
      name: "Barbería Centro",
      status: "active",
      timeZone: COSTA_RICA_TIME_ZONE,
    });
    await businessReference()
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(SERVICE_ID)
      .set({
        durationMinutes: SERVICE_DURATION_MINUTES,
        name: "Corte",
        priceInCents: 10000,
        status: SERVICE_STATUS.ACTIVE,
      });
  });

  it("AC-KAN-144-01: creates the booking with the start and an end from the service duration", async () => {
    const response = await requestBooking(slotAt("10:00"), "customer-1", {
      customerId: "spoofed-customer",
      endsAt: slotAt("17:00").toISOString(),
    });

    const booking = (
      await bookingsCollection().doc(response.bookingId).get()
    ).data();
    expect(booking?.startsAt.toDate()).toEqual(slotAt("10:00"));
    expect(booking?.endsAt.toDate()).toEqual(slotAt("10:30"));
    expect(booking?.customerId).toBe("customer-1");
    expect(booking?.collaboratorId).toBeNull();
  });

  it("AC-KAN-144-02: rejects a slot another booking took after the customer picked it", async () => {
    await addBooking(slotAt("10:00"));

    const error = await captureHttpsError(requestBooking(slotAt("10:00")));

    expect(error.code).toBe("failed-precondition");
    expect(error.message).toBe(SLOT_TAKEN_MESSAGE);
    expect(await countBookings()).toBe(1);
  });

  it("AC-KAN-141-06: a cancelled booking does not take the slot", async () => {
    await addBooking(slotAt("10:00"), null, BOOKING_STATUS.CANCELLED);

    await expect(requestBooking(slotAt("10:00"))).resolves.toHaveProperty(
      "bookingId",
    );
  });

  it("AC-KAN-143-05: rejects a slot covered by a block created after the slots were loaded", async () => {
    await addBlock(slotAt("09:45"), slotAt("10:15"));

    const error = await captureHttpsError(requestBooking(slotAt("10:00")));

    expect(error.message).toBe(SLOT_TAKEN_MESSAGE);
    expect(await countBookings()).toBe(0);
  });

  it("AC-KAN-144-03: rejects a slot outside the business hours or off the slot grid", async () => {
    const outsideHours = await captureHttpsError(
      requestBooking(slotAt("19:00")),
    );
    const offGrid = await captureHttpsError(requestBooking(slotAt("10:10")));

    expect(outsideHours.message).toBe(SLOT_TAKEN_MESSAGE);
    expect(offGrid.message).toBe(SLOT_TAKEN_MESSAGE);
  });

  it("AC-KAN-144-03: rejects a slot whose start is already in the past", async () => {
    const pastStart = new Date(Date.now() - MS_PER_DAY);

    const error = await captureHttpsError(requestBooking(pastStart));

    expect(error.message).toBe(SLOT_TAKEN_MESSAGE);
  });

  it("AC-KAN-144-06: a double click creates at most one booking, even with two free collaborators", async () => {
    await addCollaborator("collaborator-a", "Ana");
    await addCollaborator("collaborator-b", "Beto");

    const results = await Promise.allSettled([
      requestBooking(slotAt("10:00")),
      requestBooking(slotAt("10:00")),
    ]);

    expect(
      results.filter((result) => result.status === SETTLED_STATUS.FULFILLED),
    ).toHaveLength(1);
    expect(await countBookings()).toBe(1);
  });

  it("AC-KAN-144-07: two customers on the same slot get different free collaborators", async () => {
    await addCollaborator("collaborator-a", "Ana");
    await addCollaborator("collaborator-b", "Beto");

    await requestBooking(slotAt("10:00"), "customer-1");
    await requestBooking(slotAt("10:00"), "customer-2");

    const collaboratorIds = (await bookingsCollection().get()).docs
      .map((bookingDocument) => bookingDocument.get("collaboratorId"))
      .sort();
    expect(collaboratorIds).toEqual(["collaborator-a", "collaborator-b"]);
  });

  it("AC-KAN-144-07: with only the business as resource, exactly one of two customers books", async () => {
    const results = await Promise.allSettled([
      requestBooking(slotAt("10:00"), "customer-1"),
      requestBooking(slotAt("10:00"), "customer-2"),
    ]);

    expect(
      results.filter((result) => result.status === SETTLED_STATUS.FULFILLED),
    ).toHaveLength(1);
    expect(await countBookings()).toBe(1);
  });

  it("AC-KAN-144-08: assigns the free collaborator with the fewest bookings that day", async () => {
    await addCollaborator("collaborator-a", "Ana");
    await addCollaborator("collaborator-b", "Beto");
    await addBooking(slotAt("08:00"), "collaborator-a");

    const response = await requestBooking(slotAt("10:00"));

    const booking = (
      await bookingsCollection().doc(response.bookingId).get()
    ).data();
    expect(booking?.collaboratorId).toBe("collaborator-b");
    expect(booking?.collaboratorName).toBe("Beto");
  });

  it("AC-KAN-144-09: never switches when the chosen collaborator is no longer free", async () => {
    await addCollaborator("collaborator-a", "Ana");
    await addCollaborator("collaborator-b", "Beto");
    await addBooking(slotAt("10:00"), "collaborator-a");

    const error = await captureHttpsError(
      requestBooking(slotAt("10:00"), "customer-1", {
        collaboratorId: "collaborator-a",
      }),
    );

    expect(error.message).toBe(SLOT_TAKEN_MESSAGE);
    expect(await countBookings()).toBe(1);
  });

  it("AC-KAN-144-09: rejects a chosen collaborator who became inactive or is absent", async () => {
    await addCollaborator(
      "collaborator-a",
      "Ana",
      COLLABORATOR_STATUS.INACTIVE,
    );
    await addCollaborator("collaborator-b", "Beto");
    await addBlock(slotAt("08:00"), slotAt("18:00"), "collaborator-b");

    const inactive = await captureHttpsError(
      requestBooking(slotAt("10:00"), "customer-1", {
        collaboratorId: "collaborator-a",
      }),
    );
    const absent = await captureHttpsError(
      requestBooking(slotAt("10:00"), "customer-1", {
        collaboratorId: "collaborator-b",
      }),
    );

    expect(inactive.message).toBe(SLOT_TAKEN_MESSAGE);
    expect(absent.message).toBe(SLOT_TAKEN_MESSAGE);
  });

  it("AC-KAN-142-01: books the chosen collaborator when they are free", async () => {
    await addCollaborator("collaborator-a", "Ana");
    await addCollaborator("collaborator-b", "Beto");

    const response = await requestBooking(slotAt("10:00"), "customer-1", {
      collaboratorId: "collaborator-b",
    });

    const booking = (
      await bookingsCollection().doc(response.bookingId).get()
    ).data();
    expect(booking?.collaboratorId).toBe("collaborator-b");
  });
});
