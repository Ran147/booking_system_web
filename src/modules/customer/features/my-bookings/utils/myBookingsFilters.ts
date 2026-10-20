import { BOOKING_STATUS, type BookingStatus } from "@/domain";
import type { NullableRef } from "@/shared/types";
import {
  DATE_FILTER_PATTERN,
  MY_BOOKINGS_QUERY_PARAM,
  MY_BOOKINGS_TAB,
  STATUS_FILTER_OPTIONS,
  type MyBookingsTab,
} from "../constants";
import type { MyBookingsFilters } from "../models";

export const EMPTY_FILTERS: MyBookingsFilters = {
  businessId: null,
  from: null,
  status: null,
  to: null,
};

const BOOKING_STATUSES: readonly string[] = Object.values(BOOKING_STATUS);

const readDate = (rawDate: NullableRef<string>): NullableRef<string> =>
  rawDate !== null &&
  DATE_FILTER_PATTERN.test(rawDate) &&
  !Number.isNaN(Date.parse(rawDate))
    ? rawDate
    : null;

const readStatus = (
  rawStatus: NullableRef<string>,
  tab: MyBookingsTab,
): NullableRef<BookingStatus> =>
  STATUS_FILTER_OPTIONS[tab].find((status) => status === rawStatus) ?? null;

// Reads the filters from the URL; whatever is not valid for the list is
// ignored. The date range only exists in the history (AS-5).
export const readMyBookingsFilters = (
  searchParams: URLSearchParams,
  tab: MyBookingsTab,
): MyBookingsFilters => {
  const isHistory = tab === MY_BOOKINGS_TAB.HISTORY;

  return {
    businessId: searchParams.get(MY_BOOKINGS_QUERY_PARAM.BUSINESS) || null,
    from: isHistory
      ? readDate(searchParams.get(MY_BOOKINGS_QUERY_PARAM.FROM))
      : null,
    status: readStatus(searchParams.get(MY_BOOKINGS_QUERY_PARAM.STATUS), tab),
    to: isHistory
      ? readDate(searchParams.get(MY_BOOKINGS_QUERY_PARAM.TO))
      : null,
  };
};

export const buildMyBookingsSearchParams = (
  tab: MyBookingsTab,
  filters: MyBookingsFilters,
): URLSearchParams => {
  const searchParams = new URLSearchParams({
    [MY_BOOKINGS_QUERY_PARAM.TAB]: tab,
  });
  const entries = [
    [MY_BOOKINGS_QUERY_PARAM.BUSINESS, filters.businessId],
    [MY_BOOKINGS_QUERY_PARAM.FROM, filters.from],
    [MY_BOOKINGS_QUERY_PARAM.STATUS, filters.status],
    [MY_BOOKINGS_QUERY_PARAM.TO, filters.to],
  ] as const;

  entries.forEach(([name, value]) => {
    if (value) searchParams.set(name, value);
  });

  return searchParams;
};

export const hasActiveFilters = (filters: MyBookingsFilters): boolean =>
  Object.values(filters).some((value) => value !== null);

// ISO dates compare as text.
export const isRangeInvalid = (filters: MyBookingsFilters): boolean =>
  filters.from !== null && filters.to !== null && filters.to < filters.from;

export const isStatusKnown = (rawStatus: string): boolean =>
  BOOKING_STATUSES.includes(rawStatus);
