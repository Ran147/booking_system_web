import type { Nullable, PageCursor } from "@/types";
import type { ServiceListFilters } from "./ServiceListFilters.interface";

export interface ServiceListQueryParams {
  readonly businessId: string;
  readonly filters: ServiceListFilters;
  readonly pageCursor: Nullable<PageCursor>;
  readonly pageSize: number;
}
