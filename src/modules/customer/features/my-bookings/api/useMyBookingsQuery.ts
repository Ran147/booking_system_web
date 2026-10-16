import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { CursorPage } from "@/shared/types";
import { fetchMyBookingsPage } from "./fetchMyBookingsPage";
import { myBookingsQueryKeys } from "./myBookingsQueryKeys";
import type { MyBooking, MyBookingsQueryParams } from "../models";

export const useMyBookingsQuery = (
  myBookingsQueryParams: MyBookingsQueryParams,
): UseQueryResult<CursorPage<MyBooking>> =>
  useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchMyBookingsPage(myBookingsQueryParams),
    queryKey: myBookingsQueryKeys.list(myBookingsQueryParams),
  });
