import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Nullable } from "@/shared/types";
import { fetchBookingBusinessBySlug } from "./fetchBookingBusinessBySlug";
import { myBookingsQueryKeys } from "./myBookingsQueryKeys";
import type { BookingBusiness } from "../models";

export const useBookingBusinessBySlugQuery = (
  businessSlug: string,
): UseQueryResult<Nullable<BookingBusiness>> =>
  useQuery({
    queryFn: () => fetchBookingBusinessBySlug(businessSlug),
    queryKey: myBookingsQueryKeys.businessBySlug(businessSlug),
  });
