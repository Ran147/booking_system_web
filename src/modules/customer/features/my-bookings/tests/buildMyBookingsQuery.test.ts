import type { Firestore } from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";
import { FIRESTORE_OPERATOR } from "@/constants";
import { BOOKING_STATUS, type BookingStatus } from "@/domain";
import { buildMyBookingsQuery } from "../api/buildMyBookingsQuery";
import { MY_BOOKINGS_TAB, type MyBookingsTab } from "../constants";

// firebase/firestore is replaced by plain objects that keep the filters the
// query was built with, so the tests can ask which bookings those filters let
// through (the real Firestore does the same filtering on the server).
const FAKE_CONSTRAINT_TYPE = {
  AND: "and",
  OR: "or",
  ORDER_BY: "orderBy",
  WHERE: "where",
} as const;

type FakeConstraintType =
  (typeof FAKE_CONSTRAINT_TYPE)[keyof typeof FAKE_CONSTRAINT_TYPE];

interface FakeConstraint {
  readonly constraints?: FakeConstraint[];
  readonly field?: string;
  readonly operator?: string;
  readonly type: FakeConstraintType;
  readonly value?: unknown;
}

interface FakeQuery {
  readonly constraints: FakeConstraint[];
}

vi.mock("firebase/firestore", () => ({
  and: (...constraints: FakeConstraint[]): FakeConstraint => ({
    constraints,
    type: "and",
  }),
  collectionGroup: vi.fn(),
  or: (...constraints: FakeConstraint[]): FakeConstraint => ({
    constraints,
    type: "or",
  }),
  orderBy: (field: string): FakeConstraint => ({ field, type: "orderBy" }),
  query: (_source: unknown, ...constraints: FakeConstraint[]): FakeQuery => ({
    constraints,
  }),
  where: (field: string, operator: string, value: unknown): FakeConstraint => ({
    field,
    operator,
    type: "where",
    value,
  }),
}));

interface StoredBooking {
  readonly businessId: string;
  readonly customerUserId: string;
  readonly startsAt: Date;
  readonly status: BookingStatus;
}

const CUSTOMER_USER_ID = "customer-test";
const NOW = new Date("2026-11-01T12:00:00.000Z");
const ONE_DAY_MS = 86_400_000;
const NO_FILTERS = { businessId: null, from: null, status: null, to: null };

const buildStoredBooking = (
  overrides: Partial<StoredBooking> = {},
): StoredBooking => ({
  businessId: "business-a",
  customerUserId: CUSTOMER_USER_ID,
  startsAt: new Date(NOW.getTime() + ONE_DAY_MS),
  status: BOOKING_STATUS.CONFIRMED,
  ...overrides,
});

const buildFakeQuery = (tab: MyBookingsTab): FakeQuery =>
  buildMyBookingsQuery({
    customerUserId: CUSTOMER_USER_ID,
    filters: NO_FILTERS,
    firestore: {} as Firestore,
    now: NOW,
    rangeEnd: null,
    rangeStart: null,
    tab,
  }) as unknown as FakeQuery;

const compareWith = (
  storedValue: unknown,
  operator: string,
  expectedValue: unknown,
): boolean => {
  const stored =
    storedValue instanceof Date ? storedValue.getTime() : storedValue;
  const expected =
    expectedValue instanceof Date ? expectedValue.getTime() : expectedValue;

  switch (operator) {
    case FIRESTORE_OPERATOR.EQUAL:
      return stored === expected;
    case FIRESTORE_OPERATOR.IN:
      return (expected as unknown[]).includes(stored);
    case FIRESTORE_OPERATOR.GREATER_THAN:
      return (stored as number) > (expected as number);
    case FIRESTORE_OPERATOR.GREATER_OR_EQUAL:
      return (stored as number) >= (expected as number);
    case FIRESTORE_OPERATOR.LESS_OR_EQUAL:
      return (stored as number) <= (expected as number);
    default:
      throw new Error(`Operator not covered by the test: ${operator}`);
  }
};

const letsThrough = (
  constraint: FakeConstraint,
  booking: StoredBooking,
): boolean => {
  const {
    constraints = [],
    field = "",
    operator = "",
    type,
    value,
  } = constraint;

  if (type === FAKE_CONSTRAINT_TYPE.AND) {
    return constraints.every((inner) => letsThrough(inner, booking));
  }
  if (type === FAKE_CONSTRAINT_TYPE.OR) {
    return constraints.some((inner) => letsThrough(inner, booking));
  }
  if (type === FAKE_CONSTRAINT_TYPE.WHERE) {
    return compareWith(booking[field as keyof StoredBooking], operator, value);
  }
  return true;
};

const isInTab = (tab: MyBookingsTab, booking: StoredBooking): boolean =>
  buildFakeQuery(tab).constraints.every((constraint) =>
    letsThrough(constraint, booking),
  );

const collectFilteredFields = (constraint: FakeConstraint): string[] =>
  constraint.type === FAKE_CONSTRAINT_TYPE.WHERE
    ? [constraint.field ?? ""]
    : (constraint.constraints ?? []).flatMap(collectFilteredFields);

describe("buildMyBookingsQuery (KAN-151, KAN-153)", () => {
  it("AC-KAN-151-04: a cancelled booking that is still in the future is in the history, not in the upcoming list", () => {
    const cancelledInTheFuture = buildStoredBooking({
      status: BOOKING_STATUS.CANCELLED,
    });

    expect(isInTab(MY_BOOKINGS_TAB.UPCOMING, cancelledInTheFuture)).toBe(false);
    expect(isInTab(MY_BOOKINGS_TAB.HISTORY, cancelledInTheFuture)).toBe(true);
  });

  it("AC-KAN-151-04: every booking is in exactly one of the two lists", () => {
    const past = new Date(NOW.getTime() - ONE_DAY_MS);
    const bookings = [
      buildStoredBooking({ status: BOOKING_STATUS.PENDING }),
      buildStoredBooking({ status: BOOKING_STATUS.CONFIRMED }),
      buildStoredBooking({ startsAt: past, status: BOOKING_STATUS.PENDING }),
      buildStoredBooking({ startsAt: past, status: BOOKING_STATUS.CONFIRMED }),
      buildStoredBooking({ startsAt: past, status: BOOKING_STATUS.COMPLETED }),
      buildStoredBooking({ startsAt: past, status: BOOKING_STATUS.NO_SHOW }),
      buildStoredBooking({ status: BOOKING_STATUS.CANCELLED }),
      buildStoredBooking({ startsAt: past, status: BOOKING_STATUS.CANCELLED }),
    ];

    bookings.forEach((booking) => {
      const lists = [MY_BOOKINGS_TAB.UPCOMING, MY_BOOKINGS_TAB.HISTORY].filter(
        (tab) => isInTab(tab, booking),
      );

      expect(
        lists,
        `${booking.status} at ${booking.startsAt.toISOString()}`,
      ).toHaveLength(1);
    });
  });

  it("AC-KAN-153-05: the history never asks for the status of the business, so bookings of an inactive or suspended business still show", () => {
    const bookingOfSuspendedBusiness = buildStoredBooking({
      businessId: "business-suspended",
      startsAt: new Date(NOW.getTime() - ONE_DAY_MS),
      status: BOOKING_STATUS.COMPLETED,
    });
    const historyQuery = buildFakeQuery(MY_BOOKINGS_TAB.HISTORY);
    const filteredFields = historyQuery.constraints.flatMap(
      collectFilteredFields,
    );

    expect(isInTab(MY_BOOKINGS_TAB.HISTORY, bookingOfSuspendedBusiness)).toBe(
      true,
    );
    expect([...new Set(filteredFields)].sort()).toEqual([
      "customerUserId",
      "startsAt",
      "status",
    ]);
  });

  it("the query only lets through bookings of the signed-in customer", () => {
    const bookingOfAnotherCustomer = buildStoredBooking({
      customerUserId: "another-customer",
    });

    expect(isInTab(MY_BOOKINGS_TAB.UPCOMING, bookingOfAnotherCustomer)).toBe(
      false,
    );
  });
});
