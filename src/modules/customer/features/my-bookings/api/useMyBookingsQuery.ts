import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { CursorPage } from "@/shared/types";
import { fetchMyBookingsPage } from "./fetchMyBookingsPage";
import { myBookingsQueryKeys, readListKeyTab } from "./myBookingsQueryKeys";
import { NO_CUSTOMER_USER_ID } from "../constants";
import type { MyBooking, MyBookingsQueryParams } from "../models";

export const useMyBookingsQuery = (
  myBookingsQueryParams: MyBookingsQueryParams,
): UseQueryResult<CursorPage<MyBooking>> =>
  useQuery({
    enabled: myBookingsQueryParams.customerUserId !== NO_CUSTOMER_USER_ID,
    // The previous page stays while the next one loads, but not when the tab
    // changes: upcoming bookings must not stay under "History".
    placeholderData: (previousData, previousQuery) =>
      previousQuery &&
      readListKeyTab(previousQuery.queryKey) === myBookingsQueryParams.tab
        ? keepPreviousData(previousData)
        : undefined,
    queryFn: () => fetchMyBookingsPage(myBookingsQueryParams),
    queryKey: myBookingsQueryKeys.list(myBookingsQueryParams),
  });
