import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Nullable, NullableUndefined } from "@/shared/types";
import { fetchMyBooking } from "./fetchMyBooking";
import { myBookingsQueryKeys } from "./myBookingsQueryKeys";
import { NO_BUSINESS_ID } from "../constants";
import type { MyBooking } from "../models";

interface UseMyBookingQueryParams {
  bookingId: string;
  businessId: NullableUndefined<string>;
  customerUserId: string;
}

// Waits for the business: its id comes from the slug in the URL (D-2).
export const useMyBookingQuery = ({
  bookingId,
  businessId,
  customerUserId,
}: UseMyBookingQueryParams): UseQueryResult<Nullable<MyBooking>> =>
  useQuery({
    enabled: businessId !== undefined,
    queryFn: () => fetchMyBooking(businessId ?? NO_BUSINESS_ID, bookingId),
    queryKey: myBookingsQueryKeys.detail(
      customerUserId,
      businessId ?? NO_BUSINESS_ID,
      bookingId,
    ),
  });
