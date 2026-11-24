import {
  and,
  collectionGroup,
  or,
  orderBy,
  query,
  where,
  type Firestore,
  type Query,
  type QueryFilterConstraint,
} from "firebase/firestore";
import {
  FIRESTORE_COLLECTION,
  FIRESTORE_OPERATOR,
  FIRESTORE_ORDER,
} from "@/constants";
import { BOOKING_STATUS, type BookingStatus } from "@/domain";
import type { NullableRef } from "@/shared/types";
import {
  BOOKING_FIELD,
  CLOSED_BOOKING_STATUSES,
  MY_BOOKINGS_TAB,
  OPEN_BOOKING_STATUSES,
  type MyBookingsTab,
} from "../constants";
import type { MyBookingsFilters } from "../models";

interface BuildMyBookingsQueryParams {
  customerUserId: string;
  filters: MyBookingsFilters;
  firestore: Firestore;
  now: Date;
  rangeEnd: NullableRef<Date>;
  rangeStart: NullableRef<Date>;
  tab: MyBookingsTab;
}

const ALL_BOOKING_STATUSES: readonly BookingStatus[] =
  Object.values(BOOKING_STATUS);

const keepStatuses = (
  statuses: readonly BookingStatus[],
  requestedStatuses: readonly BookingStatus[],
): BookingStatus[] =>
  statuses.filter((status) => requestedStatuses.includes(status));

const hasStatusIn = (
  statuses: readonly BookingStatus[],
): QueryFilterConstraint =>
  where(BOOKING_FIELD.STATUS, FIRESTORE_OPERATOR.IN, statuses);

// One collection group query over every business of the customer (AS-1).
// Upcoming: open status and starting later, soonest first. History: the
// complement, so a booking is in exactly one list (AS-3): closed status, or
// open status that already started; most recent first (D-3). The filters
// narrow either list (AS-5); the date range only applies to the history.
export const buildMyBookingsQuery = ({
  customerUserId,
  filters,
  firestore,
  now,
  rangeEnd,
  rangeStart,
  tab,
}: BuildMyBookingsQueryParams): Query => {
  const customerBookings = collectionGroup(
    firestore,
    FIRESTORE_COLLECTION.BOOKINGS,
  );
  const ownBookingFilters = [
    where(
      BOOKING_FIELD.CUSTOMER_USER_ID,
      FIRESTORE_OPERATOR.EQUAL,
      customerUserId,
    ),
    ...(filters.businessId
      ? [
          where(
            BOOKING_FIELD.BUSINESS_ID,
            FIRESTORE_OPERATOR.EQUAL,
            filters.businessId,
          ),
        ]
      : []),
  ];

  if (tab === MY_BOOKINGS_TAB.UPCOMING) {
    return query(
      customerBookings,
      and(
        ...ownBookingFilters,
        hasStatusIn(filters.status ? [filters.status] : OPEN_BOOKING_STATUSES),
        where(BOOKING_FIELD.STARTS_AT, FIRESTORE_OPERATOR.GREATER_THAN, now),
      ),
      orderBy(BOOKING_FIELD.STARTS_AT, FIRESTORE_ORDER.ASCENDING),
    );
  }

  const requestedStatuses = filters.status
    ? [filters.status]
    : ALL_BOOKING_STATUSES;
  const closedStatuses = keepStatuses(
    CLOSED_BOOKING_STATUSES,
    requestedStatuses,
  );
  const openStatuses = keepStatuses(OPEN_BOOKING_STATUSES, requestedStatuses);
  const closedFilter =
    closedStatuses.length > 0 ? hasStatusIn(closedStatuses) : null;
  const pastOpenFilter =
    openStatuses.length > 0
      ? and(
          hasStatusIn(openStatuses),
          where(BOOKING_FIELD.STARTS_AT, FIRESTORE_OPERATOR.LESS_OR_EQUAL, now),
        )
      : null;
  const statusFilter =
    closedFilter && pastOpenFilter
      ? or(closedFilter, pastOpenFilter)
      : (closedFilter ?? pastOpenFilter ?? hasStatusIn(requestedStatuses));

  return query(
    customerBookings,
    and(
      ...ownBookingFilters,
      ...(rangeStart
        ? [
            where(
              BOOKING_FIELD.STARTS_AT,
              FIRESTORE_OPERATOR.GREATER_OR_EQUAL,
              rangeStart,
            ),
          ]
        : []),
      ...(rangeEnd
        ? [
            where(
              BOOKING_FIELD.STARTS_AT,
              FIRESTORE_OPERATOR.LESS_OR_EQUAL,
              rangeEnd,
            ),
          ]
        : []),
      statusFilter,
    ),
    orderBy(BOOKING_FIELD.STARTS_AT, FIRESTORE_ORDER.DESCENDING),
  );
};
