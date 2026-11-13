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
  buildCallableRequest,
  captureHttpsError,
  clearEmulators,
  functionsTestEnvironment,
} from "../../shared/tests/emulatorTestHelpers.js";
import type { Nullable } from "../../shared/types/Nullable.js";
import {
  formatZonedDate,
  resolveZonedInstant,
} from "../../shared/zonedTime.js";
import { getAvailability } from "../getAvailability.js";

// KAN-140 to KAN-143: the getAvailability callable against the emulators.
const callGetAvailability = functionsTestEnvironment.wrap(getAvailability);

const BUSINESS_ID = "business-availability";
const SERVICE_ID = "service-cut";
const SERVICE_DURATION_MINUTES = 60;
const COSTA_RICA_TIME_ZONE = "America/Costa_Rica";
const MS_PER_DAY = 86_400_000;
const MS_PER_MINUTE = 60_000;
const BOOKING_WINDOW_DAYS = 60;
const dateInDays = (days: number): string =>
  formatZonedDate(
    new Date(Date.now() + days * MS_PER_DAY),
    COSTA_RICA_TIME_ZONE,
  );
const BOOKING_DATE = dateInDays(2);
// Open 09:00 to 12:00 every day: with a 60-minute service the slots start at
// 09:00, 09:30, 10:00, 10:30 and 11:00.
const OPEN_EVERY_DAY = Object.fromEntries(
  [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ].map((weekday) => [weekday, [{ closesAt: "12:00", opensAt: "09:00" }]]),
);

const slotAt = (time: string): Date =>
  resolveZonedInstant(BOOKING_DATE, time, COSTA_RICA_TIME_ZONE) as Date;

interface CallerAuth {
  readonly token: { readonly role: string };
  readonly uid: string;
}

const CUSTOMER_AUTH: CallerAuth = {
  token: { role: USER_ROLE.CUSTOMER },
  uid: "customer-1",
};

const businessReference = (): DocumentReference =>
  firestore.collection(FIRESTORE_COLLECTION.BUSINESSES).doc(BUSINESS_ID);

const serviceReference = (): DocumentReference =>
  businessReference().collection(FIRESTORE_COLLECTION.SERVICES).doc(SERVICE_ID);

const collaboratorsCollection = (): CollectionReference =>
  businessReference().collection(FIRESTORE_COLLECTION.COLLABORATORS);

const requestAvailability = (
  payload: Record<string, unknown> = {},
  auth: Nullable<CallerAuth> = CUSTOMER_AUTH,
): ReturnType<typeof callGetAvailability> => {
  const fullPayload = {
    businessId: BUSINESS_ID,
    date: BOOKING_DATE,
    serviceId: SERVICE_ID,
    ...payload,
  };
  return callGetAvailability(
    auth
      ? buildAuthenticatedCallableRequest(fullPayload, auth)
      : buildCallableRequest(fullPayload),
  );
};

const readStartTimes = async (
  payload: Record<string, unknown> = {},
): Promise<string[]> =>
  (await requestAvailability(payload)).slots.map((slot) => slot.startsAt);

const addCollaborator = async (
  collaboratorId: string,
  status: string = COLLABORATOR_STATUS.ACTIVE,
): Promise<void> => {
  await collaboratorsCollection()
    .doc(collaboratorId)
    .set({ fullName: collaboratorId, serviceIds: [SERVICE_ID], status });
};

const addBooking = async (
  startsAt: Date,
  collaboratorId: Nullable<string> = null,
): Promise<void> => {
  await businessReference()
    .collection(FIRESTORE_COLLECTION.BOOKINGS)
    .add({
      collaboratorId,
      endsAt: Timestamp.fromDate(
        new Date(startsAt.getTime() + SERVICE_DURATION_MINUTES * MS_PER_MINUTE),
      ),
      startsAt: Timestamp.fromDate(startsAt),
      status: BOOKING_STATUS.CONFIRMED,
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
      startsAt: Timestamp.fromDate(startsAt),
    });
};

describe("getAvailability", () => {
  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();
    await businessReference().set({
      businessHours: OPEN_EVERY_DAY,
      status: "active",
      timeZone: COSTA_RICA_TIME_ZONE,
    });
    await serviceReference().set({
      durationMinutes: SERVICE_DURATION_MINUTES,
      name: "Corte",
      status: SERVICE_STATUS.ACTIVE,
    });
  });

  it("AC-KAN-140-01: returns the free slots of the date in the business time zone", async () => {
    const response = await requestAvailability();

    expect(response.timeZone).toBe(COSTA_RICA_TIME_ZONE);
    expect(response.date).toBe(BOOKING_DATE);
    expect(response.slots.map((slot) => slot.startsAt)).toEqual(
      ["09:00", "09:30", "10:00", "10:30", "11:00"].map((time) =>
        slotAt(time).toISOString(),
      ),
    );
    expect(response.slots[0]?.endsAt).toBe(slotAt("10:00").toISOString());
  });

  it("AC-KAN-142-02: never says who would serve a slot", async () => {
    await addCollaborator("collaborator-a");

    const response = await requestAvailability();

    expect(Object.keys(response.slots[0] ?? {}).sort()).toEqual([
      "endsAt",
      "startsAt",
    ]);
  });

  it("AC-KAN-141-09: hides only the slots that overlap a booking of the business", async () => {
    await addBooking(slotAt("10:00"));

    const startTimes = await readStartTimes();

    expect(startTimes).toEqual(
      ["09:00", "11:00"].map((time) => slotAt(time).toISOString()),
    );
  });

  it("AC-KAN-141-09: keeps a slot while another collaborator is free", async () => {
    await addCollaborator("collaborator-a");
    await addCollaborator("collaborator-b");
    await addBooking(slotAt("10:00"), "collaborator-a");

    expect(await readStartTimes()).toContain(slotAt("10:00").toISOString());
  });

  it("AC-KAN-142-01: with a chosen collaborator only their time counts", async () => {
    await addCollaborator("collaborator-a");
    await addCollaborator("collaborator-b");
    await addBooking(slotAt("10:00"), "collaborator-a");

    const startTimes = await readStartTimes({
      collaboratorId: "collaborator-a",
    });

    expect(startTimes).not.toContain(slotAt("10:00").toISOString());
  });

  it("AC-KAN-142-03: rejects a chosen collaborator who is inactive or no longer serves the service", async () => {
    await addCollaborator("collaborator-a", COLLABORATOR_STATUS.INACTIVE);
    await addCollaborator("collaborator-b");

    const inactive = await captureHttpsError(
      requestAvailability({ collaboratorId: "collaborator-a" }),
    );
    const removed = await captureHttpsError(
      requestAvailability({ collaboratorId: "collaborator-unknown" }),
    );

    expect(inactive.message).toBe(
      "customer:availability.errors.collaboratorUnavailable",
    );
    expect(removed.message).toBe(
      "customer:availability.errors.collaboratorUnavailable",
    );
  });

  it("AC-KAN-141-10: a service whose collaborators are all inactive or invited has no slot", async () => {
    await addCollaborator("collaborator-a", COLLABORATOR_STATUS.INACTIVE);
    await addCollaborator("collaborator-b", COLLABORATOR_STATUS.INVITED);

    const error = await captureHttpsError(requestAvailability());

    expect(error.message).toBe("customer:availability.slots.noCollaborator");
  });

  it("AC-KAN-143-02: a full-day block leaves the date without slots", async () => {
    await addBlock(slotAt("00:00"), slotAt("23:59"));

    const response = await requestAvailability();

    expect(response.slots).toEqual([]);
  });

  it("AC-KAN-143-04: a business without any business hours shows not configured", async () => {
    await businessReference().update({ businessHours: {} });

    const error = await captureHttpsError(requestAvailability());

    expect(error.code).toBe("failed-precondition");
    expect(error.message).toBe("customer:availability.slots.notConfigured");
  });

  it("AC-KAN-143-07: an inactive or suspended business offers no slots", async () => {
    for (const status of ["inactive", "suspended"]) {
      await businessReference().update({ status });

      const error = await captureHttpsError(requestAvailability());

      expect(error.message).toBe(
        "customer:availability.errors.businessUnavailable",
      );
    }
  });

  it("AC-KAN-140-03: a deactivated service shows service unavailable", async () => {
    await serviceReference().update({ status: SERVICE_STATUS.INACTIVE });

    const error = await captureHttpsError(requestAvailability());

    expect(error.message).toBe(
      "customer:availability.errors.serviceUnavailable",
    );
  });

  it("AC-KAN-140-04 and AC-KAN-140-05: rejects a date before today or after the booking window", async () => {
    const past = await captureHttpsError(
      requestAvailability({ date: dateInDays(-1) }),
    );
    const tooFar = await captureHttpsError(
      requestAvailability({ date: dateInDays(BOOKING_WINDOW_DAYS + 2) }),
    );

    expect(past.code).toBe("invalid-argument");
    expect(tooFar.code).toBe("invalid-argument");
  });

  it("AS-8: only a signed-in customer can ask", async () => {
    const visitor = await captureHttpsError(requestAvailability({}, null));
    const subscriber = await captureHttpsError(
      requestAvailability(
        {},
        { token: { role: USER_ROLE.SUBSCRIBER }, uid: "subscriber-1" },
      ),
    );

    expect(visitor.code).toBe("unauthenticated");
    expect(subscriber.code).toBe("permission-denied");
  });

  it("rejects a malformed date", async () => {
    const error = await captureHttpsError(
      requestAvailability({ date: "13/11/2026" }),
    );

    expect(error.code).toBe("invalid-argument");
  });
});
