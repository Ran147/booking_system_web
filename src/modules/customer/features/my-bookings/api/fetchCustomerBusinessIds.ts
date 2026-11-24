import {
  collectionGroup,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  FIRESTORE_COLLECTION,
  FIRESTORE_OPERATOR,
  FIRESTORE_ORDER,
} from "@/constants";
import { firestore } from "@/services";
import { BOOKING_FIELD, BUSINESS_FILTER_SAMPLE_SIZE } from "../constants";

// Businesses where the customer booked, read from their most recent bookings
// (the options of the business filter, AS-5).
export const fetchCustomerBusinessIds = async (
  customerUserId: string,
): Promise<string[]> => {
  const recentBookings = await getDocs(
    query(
      collectionGroup(firestore, FIRESTORE_COLLECTION.BOOKINGS),
      where(
        BOOKING_FIELD.CUSTOMER_USER_ID,
        FIRESTORE_OPERATOR.EQUAL,
        customerUserId,
      ),
      orderBy(BOOKING_FIELD.STARTS_AT, FIRESTORE_ORDER.DESCENDING),
      limit(BUSINESS_FILTER_SAMPLE_SIZE),
    ),
  );

  return [
    ...new Set(
      recentBookings.docs.map((bookingDocument) =>
        String(bookingDocument.get(BOOKING_FIELD.BUSINESS_ID)),
      ),
    ),
  ];
};
