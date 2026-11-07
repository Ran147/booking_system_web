import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Booking } from "@/domain";
import { firestore } from "@/services/firebase";
import { mapBookingDocument } from "./bookingDocument.schema";

export interface BookingListResult {
  readonly bookings: Booking[];
  readonly totalCount: number;
}

export const fetchBookingList = async (
  businessId: string,
  pageSize = 10,
): Promise<BookingListResult> => {
  if (!businessId) {
    return { bookings: [], totalCount: 0 };
  }

  const now = new Date();
  const bookingsCollection = collection(
    firestore,
    "businesses",
    businessId,
    "bookings",
  );

  const baseQuery = query(
    bookingsCollection,
    where("startsAt", ">=", now),
    orderBy("startsAt", "asc"),
  );

  const pageQuery = query(baseQuery, limit(pageSize));

  const [snapshot, countSnapshot] = await Promise.all([
    getDocs(pageQuery),
    getCountFromServer(baseQuery),
  ]);

  return {
    bookings: snapshot.docs.map(mapBookingDocument),
    totalCount: countSnapshot.data().count,
  };
};
