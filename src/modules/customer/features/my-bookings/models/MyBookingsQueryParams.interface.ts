import type { Nullable, PageCursor } from "@/shared/types";
import type { MyBookingsTab } from "../constants";

export interface MyBookingsQueryParams {
  customerUserId: string;
  pageCursor: Nullable<PageCursor>;
  pageSize: number;
  tab: MyBookingsTab;
}
