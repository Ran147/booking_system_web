import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
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

  const historyQuery = query(
    bookingsCollection,
    orderBy("startsAt", "desc"),
    limit(SCHEDULE_CONSTANTS.MAX_HISTORY_FETCH_LIMIT),
  );

  const snapshot = await getDocs(historyQuery);
  let results = snapshot.docs.map(mapBookingDocument);

  // Filter in-memory to prevent missing Firestore composite index errors
  results = results.filter((booking) => booking.startsAt < now);

  if (
    filters.status &&
    filters.status !== SCHEDULE_CONSTANTS.ALL_FILTER_VALUE
  ) {
    results = results.filter((booking) => booking.status === filters.status);
  }

  if (filters.serviceId) {
    results = results.filter(
      (booking) => booking.serviceId === filters.serviceId,
    );
  }

  if (filters.collaboratorId) {
    results = results.filter(
      (booking) => booking.collaboratorId === filters.collaboratorId,
    );
  }

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
    bookings: results.slice(0, pageSize),
    totalCount: results.length,
  };
};
