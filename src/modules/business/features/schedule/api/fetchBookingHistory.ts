import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { BOOKING_STATUS, type Booking } from "@/domain";
import { firestore } from "@/services/firebase";
import { zonedDayBounds } from "@/utils/date";
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
  timeZone: string = SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
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

  // History includes past bookings and terminal/historical statuses
  results = results.filter(
    (booking) =>
      booking.startsAt < now ||
      booking.status === BOOKING_STATUS.CANCELLED ||
      booking.status === BOOKING_STATUS.COMPLETED ||
      booking.status === BOOKING_STATUS.NO_SHOW,
  );

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

  if (filters.date) {
    const { end, start } = zonedDayBounds(filters.date, timeZone);
    results = results.filter(
      (booking) => booking.startsAt >= start && booking.startsAt <= end,
    );
  } else if (
    filters.startDate &&
    filters.endDate &&
    filters.startDate > filters.endDate
  ) {
    // Range is invalid; don't filter out by broken range
  } else {
    if (filters.startDate) {
      const { start } = zonedDayBounds(filters.startDate, timeZone);
      results = results.filter((booking) => booking.startsAt >= start);
    }

    if (filters.endDate) {
      const { end } = zonedDayBounds(filters.endDate, timeZone);
      results = results.filter((booking) => booking.startsAt <= end);
    }
  }

  return {
    bookings: results.slice(0, pageSize),
    totalCount: results.length,
  };
};
