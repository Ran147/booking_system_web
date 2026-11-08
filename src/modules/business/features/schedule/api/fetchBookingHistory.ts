import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { FUNCTION_NAME } from "@/constants";
import type { Booking } from "@/domain";
import { callFunction, firestore } from "@/services/firebase";
import type { Nullable } from "@/types";
import { zonedDayBounds } from "@/utils/date";
import { SCHEDULE_CONSTANTS } from "../constants";
import type { BookingHistoryFilterValues } from "../models";
import { mapBookingDocument } from "./bookingDocument.schema";

export interface BookingHistoryResult {
  readonly bookings: Booking[];
  readonly totalCount: number;
}

interface FetchBookingHistoryResponse {
  readonly bookings: Array<{
    readonly businessId: string;
    readonly cancellation?: Booking["cancellation"];
    readonly collaboratorId: Nullable<string>;
    readonly collaboratorName: Nullable<string>;
    readonly createdAt: string;
    readonly customerId: string;
    readonly customerUserId: Nullable<string>;
    readonly endsAt: string;
    readonly id: string;
    readonly rescheduleHistory?: Booking["rescheduleHistory"];
    readonly serviceId: string;
    readonly serviceSnapshot: Booking["serviceSnapshot"];
    readonly startsAt: string;
    readonly status: Booking["status"];
    readonly updatedAt: string;
  }>;
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

  let results: Booking[] = [];

  try {
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
    results = snapshot.docs.map(mapBookingDocument);
  } catch {
    // If client query fails, fallback to serverless function
    try {
      const response = await callFunction<
        { readonly businessId: string },
        FetchBookingHistoryResponse
      >(FUNCTION_NAME.FETCH_BOOKING_HISTORY, { businessId });

      results = (response.bookings ?? []).map((rawBooking) => ({
        businessId: rawBooking.businessId,
        cancellation: rawBooking.cancellation ?? null,
        collaboratorId: rawBooking.collaboratorId ?? null,
        collaboratorName: rawBooking.collaboratorName ?? null,
        createdAt: new Date(rawBooking.createdAt),
        customerId: rawBooking.customerId,
        customerUserId: rawBooking.customerUserId ?? null,
        endsAt: new Date(rawBooking.endsAt),
        id: rawBooking.id,
        rescheduleHistory: rawBooking.rescheduleHistory ?? [],
        serviceId: rawBooking.serviceId,
        serviceSnapshot: rawBooking.serviceSnapshot,
        startsAt: new Date(rawBooking.startsAt),
        status: rawBooking.status,
        updatedAt: new Date(rawBooking.updatedAt),
      }));
    } catch {
      return { bookings: [], totalCount: 0 };
    }
  }

  // If a specific status filter is set, filter by that status.
  // When filters.status is "all" or omitted, return all statuses without exclusions.
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
