import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Nullable } from "@/types";
import { availabilityQueryKeys } from "./availabilityQueryKeys";
import { fetchBookingContext } from "./fetchBookingContext";
import type { BookingContext } from "../models/availability.model";

export const useBookingContextQuery = (
  businessSlug: string,
  serviceId: string,
): UseQueryResult<Nullable<BookingContext>> =>
  useQuery({
    queryFn: () => fetchBookingContext(businessSlug, serviceId),
    queryKey: availabilityQueryKeys.bookingContext(businessSlug, serviceId),
  });
