// @vitest-environment node
import { callApiFunction, type FunctionResult } from "./callApiFunction";
import { firebaseAdminFake } from "./firebaseAdminFake";

// Who may call each protected action of the Vercel backend (KAN-59 spec §4):
// checkCallerAccess in api/callFunction.ts, with the same conditions as
// functions/ and firestore.rules. The shared booking handlers of functions/src
// have their own tests; here they are replaced to check only who reaches them.
const handlerFake = vi.hoisted(() => ({
  handleCheckBusinessSlug: vi.fn(),
  handleCreateBooking: vi.fn(),
  handleGetAvailability: vi.fn(),
}));

vi.mock(
  "../../functions/src/bookings/handlers/handleGetAvailability.js",
  () => ({ handleGetAvailability: handlerFake.handleGetAvailability }),
);

vi.mock(
  "../../functions/src/billing/handlers/handleCheckBusinessSlug.js",
  () => ({
    handleCheckBusinessSlug: handlerFake.handleCheckBusinessSlug,
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

vi.mock("firebase-admin/auth", async () => {
  const { firebaseAdminFake: fake } = await import("./firebaseAdminFake");
  return { getAuth: (): typeof fake.auth => fake.auth };
});

vi.mock("firebase-admin/firestore", async () => {
  const { firebaseAdminFake: fake } = await import("./firebaseAdminFake");
  return {
    getFirestore: (): typeof fake.firestore => fake.firestore,
    Timestamp: {
      fromDate: (date: Date): ReturnType<typeof fake.createTimestamp> =>
        fake.createTimestamp(date.getTime()),
      fromMillis: fake.createTimestamp,
      now: (): ReturnType<typeof fake.createTimestamp> =>
        fake.createTimestamp(Date.now()),
    },
  };
});

const BUSINESS_ID = "business-a";
const BUSINESS_PATH = `businesses/${BUSINESS_ID}`;
const INACTIVE_SERVICE_PATH = `${BUSINESS_PATH}/services/service-inactive`;
const ACTIVE_SERVICE_PATH = `${BUSINESS_PATH}/services/service-active`;
const COLLABORATOR_PATH = `${BUSINESS_PATH}/collaborators/collaborator-a`;
const BOOKING_PATH = `${BUSINESS_PATH}/bookings/booking-a`;
const SCHEDULE_BLOCK_PATH = `${BUSINESS_PATH}/scheduleBlocks/block-a`;

const HTTP_STATUS = Object.freeze({
  FORBIDDEN: 403,
  OK: 200,
  UNAUTHORIZED: 401,
});

const ID_TOKEN = Object.freeze({
  COLLABORATOR: "token-collaborator",
  CUSTOMER: "token-customer",
  OTHER_BUSINESS_COLLABORATOR: "token-other-business-collaborator",
  OTHER_CUSTOMER: "token-other-customer",
  OTHER_OWNER: "token-other-owner",
  OWNER: "token-owner",
  OWNER_WITHOUT_CLAIMS: "token-owner-without-claims",
  UNKNOWN: "token-unknown",
});

// Far enough ahead that "cannot reschedule a past booking" never applies.
const FUTURE_BOOKING = Object.freeze({
  NEW_STARTS_AT: "2099-01-06T15:00:00.000Z",
  STARTS_AT: "2099-01-05T15:00:00.000Z",
});

const FORM_VALUES = { durationMinutes: 30, name: "Corte", price: 10 };

const PROTECTED_CALLS = Object.freeze({
  cancelBooking: {
    bookingId: "booking-a",
    businessId: BUSINESS_ID,
    note: "No puedo asistir",
  },
  createBooking: {
    businessId: BUSINESS_ID,
    customerId: "customer-a",
    serviceId: "service-active",
    startsAt: "2026-12-02T15:00:00.000Z",
  },
  createScheduleBlock: {
    businessId: BUSINESS_ID,
    endsAt: "2026-12-02T18:00:00.000Z",
    isFullDay: false,
    startsAt: "2026-12-02T16:00:00.000Z",
  },
  createService: { businessId: BUSINESS_ID, formValues: FORM_VALUES },
  deleteScheduleBlock: { blockId: "block-a", businessId: BUSINESS_ID },
  deleteService: { businessId: BUSINESS_ID, serviceId: "service-inactive" },
  fetchBookingHistory: { businessId: BUSINESS_ID },
  fetchScheduleBlocks: { businessId: BUSINESS_ID },
  getAvailability: {
    businessId: BUSINESS_ID,
    date: "2026-12-02",
    serviceId: "service-active",
  },
  rescheduleBooking: {
    bookingId: "booking-a",
    businessId: BUSINESS_ID,
    newStartsAt: "2026-12-03T15:00:00.000Z",
  },
  updateBookingStatus: {
    bookingId: "booking-a",
    businessId: BUSINESS_ID,
    targetStatus: "confirmed",
  },
  updateBusinessHours: {
    businessHours: { monday: [{ closesAt: "17:00", opensAt: "09:00" }] },
    businessId: BUSINESS_ID,
  },
  updateConfirmationMode: { businessId: BUSINESS_ID, mode: "manual" },
  updateService: {
    businessId: BUSINESS_ID,
    formValues: { ...FORM_VALUES, name: "Corte editado" },
    serviceId: "service-inactive",
  },
  updateServiceCollaborators: {
    businessId: BUSINESS_ID,
    collaboratorIds: [],
    serviceId: "service-inactive",
  },
});

const seedBusiness = (): void => {
  firebaseAdminFake.documents.set(BUSINESS_PATH, {
    bookingConfirmationMode: "automatic",
    ownerUserId: "owner-a",
    status: "active",
  });
  firebaseAdminFake.documents.set("businesses/business-b", {
    ownerUserId: "owner-b",
    status: "active",
  });
  firebaseAdminFake.documents.set(INACTIVE_SERVICE_PATH, {
    name: "Servicio inactivo",
    status: "inactive",
  });
  firebaseAdminFake.documents.set(ACTIVE_SERVICE_PATH, {
    durationMinutes: 30,
    name: "Servicio activo",
    status: "active",
  });
  firebaseAdminFake.documents.set(COLLABORATOR_PATH, {
    permissions: ["manage_services"],
    status: "active",
  });
  firebaseAdminFake.documents.set(BOOKING_PATH, {
    customerUserId: "customer-a",
    startsAt: "2026-12-02T15:00:00.000Z",
    status: "confirmed",
  });
  firebaseAdminFake.documents.set(SCHEDULE_BLOCK_PATH, {
    businessId: BUSINESS_ID,
    endsAt: "2026-12-02T18:00:00.000Z",
    startsAt: "2026-12-02T16:00:00.000Z",
  });
  firebaseAdminFake.signIn(ID_TOKEN.OWNER, {
    businessId: BUSINESS_ID,
    role: "subscriber",
    uid: "owner-a",
  });
  firebaseAdminFake.signIn(ID_TOKEN.OWNER_WITHOUT_CLAIMS, { uid: "owner-a" });
  firebaseAdminFake.signIn(ID_TOKEN.OTHER_OWNER, {
    businessId: "business-b",
    role: "subscriber",
    uid: "owner-b",
  });
  firebaseAdminFake.signIn(ID_TOKEN.COLLABORATOR, {
    businessId: BUSINESS_ID,
    collaboratorId: "collaborator-a",
    role: "collaborator",
    uid: "collaborator-user-a",
  });
  firebaseAdminFake.signIn(ID_TOKEN.OTHER_BUSINESS_COLLABORATOR, {
    businessId: "business-b",
    collaboratorId: "collaborator-a",
    role: "collaborator",
    uid: "collaborator-user-b",
  });
  firebaseAdminFake.signIn(ID_TOKEN.CUSTOMER, {
    role: "customer",
    uid: "customer-a",
  });
  firebaseAdminFake.signIn(ID_TOKEN.OTHER_CUSTOMER, {
    role: "customer",
    uid: "customer-b",
  });
};

const grantCollaborator = (permissions: readonly string[]): void => {
  firebaseAdminFake.documents.set(COLLABORATOR_PATH, {
    permissions: [...permissions],
    status: "active",
  });
};

const readDocumentsCopy = (): Map<string, Record<string, unknown>> =>
  new Map(firebaseAdminFake.documents);

const callAs = (
  functionName: keyof typeof PROTECTED_CALLS,
  idToken: string,
): Promise<FunctionResult> =>
  callApiFunction(functionName, PROTECTED_CALLS[functionName], idToken);

describe("api callFunction: caller access (KAN-59)", () => {
  beforeEach(() => {
    firebaseAdminFake.reset();
    handlerFake.handleCreateBooking.mockReset();
    handlerFake.handleGetAvailability.mockReset();
    seedBusiness();
  });

  it.each(Object.entries(PROTECTED_CALLS))(
    "KAN-59: %s without a session answers unauthenticated and writes nothing",
    async (functionName, payload) => {
      const documentsBefore = readDocumentsCopy();

      const result = await callApiFunction(functionName, payload);

      expect(result).toMatchObject({
        body: { error: "unauthenticated" },
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
      expect(firebaseAdminFake.documents).toEqual(documentsBefore);
    },
  );

  it("KAN-59: a token that does not verify answers unauthenticated", async () => {
    const result = await callAs("createService", ID_TOKEN.UNKNOWN);

    expect(result.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  describe("services", () => {
    it("AC-KAN-54-01, AC-KAN-56-01, AC-KAN-59-01: the owner creates, edits and deletes the services of their business", async () => {
      const createResult = await callAs("createService", ID_TOKEN.OWNER);
      const updateResult = await callAs("updateService", ID_TOKEN.OWNER);
      const deleteResult = await callAs("deleteService", ID_TOKEN.OWNER);

      expect(createResult.statusCode).toBe(HTTP_STATUS.OK);
      expect(updateResult.statusCode).toBe(HTTP_STATUS.OK);
      expect(deleteResult.statusCode).toBe(HTTP_STATUS.OK);
      expect(firebaseAdminFake.documents.has(INACTIVE_SERVICE_PATH)).toBe(
        false,
      );
    });

    it("KAN-59: an owner without claims is recognized by the ownerUserId of the business (spec D2)", async () => {
      const result = await callAs(
        "createService",
        ID_TOKEN.OWNER_WITHOUT_CLAIMS,
      );

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
    });

    it("KAN-59: the owner of another business is denied and the service is left as it is", async () => {
      const serviceBefore = firebaseAdminFake.documents.get(
        INACTIVE_SERVICE_PATH,
      );

      const result = await callAs("updateService", ID_TOKEN.OTHER_OWNER);

      expect(result).toMatchObject({
        body: { error: "permission-denied" },
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
      expect(firebaseAdminFake.documents.get(INACTIVE_SERVICE_PATH)).toEqual(
        serviceBefore,
      );
    });

    it("AC-KAN-61-07: an active collaborator with manage_services may manage services", async () => {
      const result = await callAs(
        "updateServiceCollaborators",
        ID_TOKEN.COLLABORATOR,
      );

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
    });

    it.each([
      {
        collaborator: { permissions: [], status: "active" },
        label: "without manage_services",
      },
      {
        collaborator: { permissions: ["manage_services"], status: "inactive" },
        label: "inactive",
      },
    ])(
      "AC-KAN-61-07: a collaborator $label is denied",
      async ({ collaborator }) => {
        firebaseAdminFake.documents.set(COLLABORATOR_PATH, collaborator);

        const result = await callAs("updateService", ID_TOKEN.COLLABORATOR);

        expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      },
    );

    it("KAN-59: only the owner deletes a service, not a collaborator", async () => {
      const result = await callAs("deleteService", ID_TOKEN.COLLABORATOR);

      expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(firebaseAdminFake.documents.has(INACTIVE_SERVICE_PATH)).toBe(true);
    });
  });

  describe("business settings (owner only)", () => {
    it("KAN-64: the owner changes the business hours of their business", async () => {
      const result = await callAs("updateBusinessHours", ID_TOKEN.OWNER);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      expect(
        firebaseAdminFake.documents.get(BUSINESS_PATH)?.businessHours,
      ).toEqual(PROTECTED_CALLS.updateBusinessHours.businessHours);
    });

    it("KAN-70: the owner changes the confirmation mode of their business", async () => {
      const result = await callAs("updateConfirmationMode", ID_TOKEN.OWNER);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      expect(
        firebaseAdminFake.documents.get(BUSINESS_PATH)?.bookingConfirmationMode,
      ).toBe("manual");
    });

    it.each(["updateConfirmationMode", "updateBusinessHours"] as const)(
      "KAN-64, KAN-70: %s is denied to a collaborator, even with every permission, and the business is left as it is",
      async (functionName) => {
        grantCollaborator([
          "manage_bookings",
          "manage_schedule_blocks",
          "manage_services",
        ]);
        const businessBefore = firebaseAdminFake.documents.get(BUSINESS_PATH);

        const result = await callAs(functionName, ID_TOKEN.COLLABORATOR);

        expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
        expect(firebaseAdminFake.documents.get(BUSINESS_PATH)).toEqual(
          businessBefore,
        );
      },
    );
  });

  describe("schedule blocks", () => {
    it("KAN-65, KAN-66: a collaborator with manage_schedule_blocks creates and deletes blocks", async () => {
      grantCollaborator(["manage_schedule_blocks"]);

      const createResult = await callAs(
        "createScheduleBlock",
        ID_TOKEN.COLLABORATOR,
      );
      const deleteResult = await callAs(
        "deleteScheduleBlock",
        ID_TOKEN.COLLABORATOR,
      );

      expect(createResult.statusCode).toBe(HTTP_STATUS.OK);
      expect(deleteResult.statusCode).toBe(HTTP_STATUS.OK);
      expect(firebaseAdminFake.documents.has(SCHEDULE_BLOCK_PATH)).toBe(false);
    });

    it("AC-KAN-66-09: a collaborator without manage_schedule_blocks cannot create a block", async () => {
      const documentsBefore = readDocumentsCopy();

      const result = await callAs("createScheduleBlock", ID_TOKEN.COLLABORATOR);

      expect(result).toMatchObject({
        body: { error: "permission-denied" },
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
      expect(firebaseAdminFake.documents).toEqual(documentsBefore);
    });

    it("KAN-65: a collaborator without manage_schedule_blocks cannot delete a block", async () => {
      const result = await callAs("deleteScheduleBlock", ID_TOKEN.COLLABORATOR);

      expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(firebaseAdminFake.documents.has(SCHEDULE_BLOCK_PATH)).toBe(true);
    });

    it("KAN-67: any active collaborator of the business reads its blocks", async () => {
      const result = await callAs("fetchScheduleBlocks", ID_TOKEN.COLLABORATOR);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
    });

    it("KAN-67: the owner of another business cannot read the blocks", async () => {
      const result = await callAs("fetchScheduleBlocks", ID_TOKEN.OTHER_OWNER);

      expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it("KAN-67: an inactive collaborator cannot read the blocks", async () => {
      firebaseAdminFake.documents.set(COLLABORATOR_PATH, {
        permissions: ["manage_schedule_blocks"],
        status: "inactive",
      });

      const result = await callAs("fetchScheduleBlocks", ID_TOKEN.COLLABORATOR);

      expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it("KAN-67: a collaborator whose businessId claim is another business cannot read the blocks", async () => {
      const result = await callAs(
        "fetchScheduleBlocks",
        ID_TOKEN.OTHER_BUSINESS_COLLABORATOR,
      );

      expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });
  });

  describe("business bookings (manage_bookings)", () => {
    it("KAN-70, KAN-76: a collaborator with manage_bookings reads the booking history and confirms a booking", async () => {
      grantCollaborator(["manage_bookings"]);
      firebaseAdminFake.documents.set(BOOKING_PATH, {
        customerUserId: "customer-a",
        startsAt: "2026-12-02T15:00:00.000Z",
        status: "pending",
      });

      const historyResult = await callAs(
        "fetchBookingHistory",
        ID_TOKEN.COLLABORATOR,
      );
      const statusResult = await callAs(
        "updateBookingStatus",
        ID_TOKEN.COLLABORATOR,
      );

      expect(historyResult.statusCode).toBe(HTTP_STATUS.OK);
      expect(statusResult.statusCode).toBe(HTTP_STATUS.OK);
    });

    it.each(["fetchBookingHistory", "updateBookingStatus"] as const)(
      "KAN-70, KAN-76: %s is denied to a collaborator without manage_bookings",
      async (functionName) => {
        const bookingBefore = firebaseAdminFake.documents.get(BOOKING_PATH);

        const result = await callAs(functionName, ID_TOKEN.COLLABORATOR);

        expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
        expect(firebaseAdminFake.documents.get(BOOKING_PATH)).toEqual(
          bookingBefore,
        );
      },
    );
  });

  describe("cancel and reschedule", () => {
    it("KAN-159: the customer of the booking cancels it", async () => {
      const result = await callAs("cancelBooking", ID_TOKEN.CUSTOMER);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      expect(firebaseAdminFake.documents.get(BOOKING_PATH)?.status).toBe(
        "cancelled",
      );
    });

    it.each(["cancelBooking", "rescheduleBooking"] as const)(
      "KAN-158, KAN-159: %s is denied to another customer and the booking is left as it is",
      async (functionName) => {
        const bookingBefore = firebaseAdminFake.documents.get(BOOKING_PATH);

        const result = await callAs(functionName, ID_TOKEN.OTHER_CUSTOMER);

        expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
        expect(firebaseAdminFake.documents.get(BOOKING_PATH)).toEqual(
          bookingBefore,
        );
      },
    );

    it("KAN-72: the owner cancels a booking of their business", async () => {
      const result = await callAs("cancelBooking", ID_TOKEN.OWNER);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      expect(firebaseAdminFake.documents.get(BOOKING_PATH)?.status).toBe(
        "cancelled",
      );
    });

    it("KAN-71: a collaborator with manage_bookings reschedules a booking", async () => {
      grantCollaborator(["manage_bookings"]);
      firebaseAdminFake.documents.set(BOOKING_PATH, {
        customerUserId: "customer-a",
        startsAt: FUTURE_BOOKING.STARTS_AT,
        status: "confirmed",
      });

      const result = await callApiFunction(
        "rescheduleBooking",
        {
          ...PROTECTED_CALLS.rescheduleBooking,
          newStartsAt: FUTURE_BOOKING.NEW_STARTS_AT,
        },
        ID_TOKEN.COLLABORATOR,
      );

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      expect(firebaseAdminFake.documents.get(BOOKING_PATH)?.startsAt).toEqual(
        new Date(FUTURE_BOOKING.NEW_STARTS_AT),
      );
    });

    it("KAN-72: a collaborator without manage_bookings cannot cancel a booking", async () => {
      const result = await callAs("cancelBooking", ID_TOKEN.COLLABORATOR);

      expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });
  });

  describe("availability and new bookings", () => {
    it("KAN-144: a customer reaches the booking handler as the uid of their token, not the customerId of the payload", async () => {
      handlerFake.handleCreateBooking.mockResolvedValue({ bookingId: "new" });

      const result = await callApiFunction(
        "createBooking",
        { ...PROTECTED_CALLS.createBooking, customerId: "customer-b" },
        ID_TOKEN.CUSTOMER,
      );

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      expect(handlerFake.handleCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          caller: { role: "customer", uid: "customer-a" },
          payload: expect.objectContaining({ customerId: "customer-b" }),
        }),
      );
    });

    it("KAN-59: the owner of another business cannot book on this business", async () => {
      const documentsBefore = readDocumentsCopy();

      const result = await callAs("createBooking", ID_TOKEN.OTHER_OWNER);

      expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(handlerFake.handleCreateBooking).not.toHaveBeenCalled();
      expect(firebaseAdminFake.documents).toEqual(documentsBefore);
    });

    it("KAN-140: a customer reads the free slots", async () => {
      handlerFake.handleGetAvailability.mockResolvedValue({ slots: [] });

      const result = await callAs("getAvailability", ID_TOKEN.CUSTOMER);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
    });

    it("KAN-140: the free slots are only for customers", async () => {
      const result = await callAs("getAvailability", ID_TOKEN.OWNER);

      expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(handlerFake.handleGetAvailability).not.toHaveBeenCalled();
    });
  });

  it("KAN-59: a public action still works without a session", async () => {
    handlerFake.handleCheckBusinessSlug.mockResolvedValue({
      availability: "available",
    });

    const result = await callApiFunction("checkBusinessSlug", {
      businessSlug: "libre",
      signUpToken: "sign-up-token",
    });

    expect(result).toEqual({
      body: { availability: "available" },
      statusCode: HTTP_STATUS.OK,
    });
    expect(handlerFake.handleCheckBusinessSlug).toHaveBeenCalledWith(
      expect.objectContaining({ caller: null }),
    );
  });

  it("KAN-59: an action that is not declared is denied by default", async () => {
    const result = await callApiFunction(
      "exportCollection",
      {},
      ID_TOKEN.OWNER,
    );

    expect(result.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
  });
});
