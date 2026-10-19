import { ROUTE_PATH } from "@/constants";

const BOOKING_ID_PARAM = ":bookingId";

// The detail lives under the slug of the booking's own business (D-2, Q4).
export const buildBookingDetailPath = (
  businessSlug: string,
  bookingId: string,
): string =>
  `/${businessSlug}/${ROUTE_PATH.CUSTOMER.BOOKING_DETAIL.replace(BOOKING_ID_PARAM, bookingId)}`;
