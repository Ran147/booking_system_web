import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { CursorPage } from "@/shared/types";
import { fetchMyBookingsPage } from "./fetchMyBookingsPage";
import { myBookingsQueryKeys } from "./myBookingsQueryKeys";
import { NO_CUSTOMER_USER_ID } from "../constants";
import type { MyBooking, MyBookingsQueryParams } from "../models";

export const useMyBookingsQuery = (
  myBookingsQueryParams: MyBookingsQueryParams,
): UseQueryResult<CursorPage<MyBooking>> =>
  useQuery({
    enabled: myBookingsQueryParams.customerUserId !== NO_CUSTOMER_USER_ID,
    placeholderData: keepPreviousData,
    queryFn: () => fetchMyBookingsPage(myBookingsQueryParams),
    queryKey: myBookingsQueryKeys.list(myBookingsQueryParams),
  });
