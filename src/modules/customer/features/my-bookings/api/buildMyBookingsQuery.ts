import {
  and,
  collectionGroup,
  or,
  orderBy,
  query,
  where,
  type Firestore,
  type Query,
} from "firebase/firestore";
import {
  FIRESTORE_COLLECTION,
  FIRESTORE_OPERATOR,
  FIRESTORE_ORDER,
} from "@/constants";
import {
  BOOKING_FIELD,
  CLOSED_BOOKING_STATUSES,
  MY_BOOKINGS_TAB,
  OPEN_BOOKING_STATUSES,
  type MyBookingsTab,
} from "../constants";

interface BuildMyBookingsQueryParams {
  customerUserId: string;
  firestore: Firestore;
  now: Date;
  tab: MyBookingsTab;
}

// One collection group query over every business of the customer (AS-1).
// Upcoming: open status and starting later, soonest first. History: the
// complement, so a booking is in exactly one list (AS-3): closed status, or
// open status that already started; most recent first (D-3).
export const buildMyBookingsQuery = ({
  customerUserId,
  firestore,
  now,
  tab,
}: BuildMyBookingsQueryParams): Query => {
  const customerBookings = collectionGroup(
    firestore,
    FIRESTORE_COLLECTION.BOOKINGS,
  );
  const isOwnBooking = where(
    BOOKING_FIELD.CUSTOMER_USER_ID,
    FIRESTORE_OPERATOR.EQUAL,
    customerUserId,
  );
  const hasOpenStatus = where(
    BOOKING_FIELD.STATUS,
    FIRESTORE_OPERATOR.IN,
    OPEN_BOOKING_STATUSES,
  );

  if (tab === MY_BOOKINGS_TAB.UPCOMING) {
    return query(
      customerBookings,
      isOwnBooking,
      hasOpenStatus,
      where(BOOKING_FIELD.STARTS_AT, FIRESTORE_OPERATOR.GREATER_THAN, now),
      orderBy(BOOKING_FIELD.STARTS_AT, FIRESTORE_ORDER.ASCENDING),
    );
  }

  return query(
    customerBookings,
    and(
      isOwnBooking,
      or(
        where(
          BOOKING_FIELD.STATUS,
          FIRESTORE_OPERATOR.IN,
          CLOSED_BOOKING_STATUSES,
        ),
        and(
          hasOpenStatus,
          where(BOOKING_FIELD.STARTS_AT, FIRESTORE_OPERATOR.LESS_OR_EQUAL, now),
        ),
      ),
    ),
    orderBy(BOOKING_FIELD.STARTS_AT, FIRESTORE_ORDER.DESCENDING),
  );
};
