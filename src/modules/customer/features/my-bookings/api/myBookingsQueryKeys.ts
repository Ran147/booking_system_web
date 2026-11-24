import type { QueryKey } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants";
import { BUSINESS_FIELD } from "../constants";
import type { MyBookingsQueryParams } from "../models";

// Position of the tab in the key of a list: [bookings, user, tab, ...].
const LIST_KEY_TAB_INDEX = 2;

export const myBookingsQueryKeys = {
  all: (customerUserId: string): QueryKey =>
    [FIRESTORE_COLLECTION.BOOKINGS, customerUserId] as const,
  business: (businessId: string): QueryKey =>
    [FIRESTORE_COLLECTION.BUSINESSES, businessId] as const,
  businessBySlug: (businessSlug: string): QueryKey =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      BUSINESS_FIELD.SLUG,
      businessSlug,
    ] as const,
  businessIds: (customerUserId: string): QueryKey =>
    [
      ...myBookingsQueryKeys.all(customerUserId),
      FIRESTORE_COLLECTION.BUSINESSES,
    ] as const,
  detail: (
    customerUserId: string,
    businessId: string,
    bookingId: string,
  ): QueryKey =>
    [
      ...myBookingsQueryKeys.all(customerUserId),
      businessId,
      bookingId,
    ] as const,
  list: ({
    customerUserId,
    filters,
    pageCursor,
    pageSize,
    tab,
    timeZone,
  }: MyBookingsQueryParams): QueryKey =>
    [
      ...myBookingsQueryKeys.all(customerUserId),
      tab,
      filters,
      timeZone,
      pageCursor?.ref.path ?? null,
      pageSize,
    ] as const,
};

export const readListKeyTab = (queryKey: QueryKey): unknown =>
  queryKey[LIST_KEY_TAB_INDEX];
