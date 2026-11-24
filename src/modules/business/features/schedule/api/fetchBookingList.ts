import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { PAGINATION } from "@/constants";
import type { Booking } from "@/domain";
import { firestore } from "@/services/firebase";
import { mapBookingDocument } from "./bookingDocument.schema";

export interface BookingListResult {
  readonly bookings: Booking[];
  readonly totalCount: number;
}

export const fetchBookingList = async (
  businessId: string,
  page = 1,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
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

  const pageQuery = query(baseQuery, limit(page * pageSize));

  const [snapshot, countSnapshot] = await Promise.all([
    getDocs(pageQuery),
    getCountFromServer(baseQuery),
  ]);

  const allFetched = snapshot.docs.map(mapBookingDocument);
  const startIndex = (page - 1) * pageSize;
  const pageDocs = allFetched.slice(startIndex, startIndex + pageSize);

  return {
    bookings: pageDocs,
    totalCount: countSnapshot.data().count,
  };
};
