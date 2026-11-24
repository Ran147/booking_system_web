import type { Nullable, PageCursor } from "@/shared/types";
import type { MyBookingsTab } from "../constants";
import type { MyBookingsFilters } from "./MyBookingsFilters.interface";

export interface MyBookingsQueryParams {
  customerUserId: string;
  filters: MyBookingsFilters;
  pageCursor: Nullable<PageCursor>;
  pageSize: number;
  tab: MyBookingsTab;
  // Zone in which the date range of the filters is read.
  timeZone: string;
}
