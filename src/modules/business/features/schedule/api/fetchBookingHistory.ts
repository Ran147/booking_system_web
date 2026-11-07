import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import type { Booking } from "@/domain";
import { firestore } from "@/services/firebase";
import { SCHEDULE_CONSTANTS } from "../constants";
import type { BookingHistoryFilterValues } from "../models";
import { mapBookingDocument } from "./bookingDocument.schema";

export interface BookingHistoryResult {
  readonly bookings: Booking[];
  readonly totalCount: number;
}

export const fetchBookingHistory = async (
  businessId: string,
  filters: BookingHistoryFilterValues,
  pageSize = 10,
): Promise<BookingHistoryResult> => {
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

  const constraints: QueryConstraint[] = [
    where("startsAt", "<", now),
    orderBy("startsAt", "desc"),
  ];

  if (
    filters.status &&
    filters.status !== SCHEDULE_CONSTANTS.ALL_FILTER_VALUE
  ) {
    constraints.unshift(where("status", "==", filters.status));
  }

  if (filters.serviceId) {
    constraints.unshift(where("serviceId", "==", filters.serviceId));
  }

  if (filters.collaboratorId) {
    constraints.unshift(where("collaboratorId", "==", filters.collaboratorId));
  }

  const baseQuery = query(bookingsCollection, ...constraints);
  const pageQuery = query(baseQuery, limit(pageSize));

  const [snapshot, countSnapshot] = await Promise.all([
    getDocs(pageQuery),
    getCountFromServer(baseQuery),
  ]);

  let results = snapshot.docs.map(mapBookingDocument);

  // In-memory date range filter if provided to accommodate timezone boundaries without complex compound index variations
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    results = results.filter((booking) => booking.startsAt >= startDate);
  }
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    endDate.setHours(
      SCHEDULE_CONSTANTS.END_OF_DAY_HOURS,
      SCHEDULE_CONSTANTS.END_OF_DAY_MINUTES,
      SCHEDULE_CONSTANTS.END_OF_DAY_SECONDS,
      SCHEDULE_CONSTANTS.END_OF_DAY_MS,
    );
    results = results.filter((booking) => booking.startsAt <= endDate);
  }

  return {
    bookings: results,
    totalCount: countSnapshot.data().count,
  };
};
