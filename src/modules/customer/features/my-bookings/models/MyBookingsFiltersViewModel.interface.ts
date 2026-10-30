import type { NullableRef } from "@/shared/types";
import type { BookingBusiness } from "./BookingBusiness.interface";
import type { MyBookingsFilters } from "./MyBookingsFilters.interface";
import type { MyBookingsTab } from "../constants";

export interface FilterOption {
  label: string;
  value: string;
}

export interface MyBookingsFiltersViewModel {
  activeTab: MyBookingsTab;
  businessOptions: FilterOption[];
  filters: MyBookingsFilters;
  handleClearFilters: () => void;
  handleFilterChange: (changedFilters: Partial<MyBookingsFilters>) => void;
  handleStatusChange: (rawStatus: string) => void;
  handleTabChange: (tabId: string) => void;
  hasActiveFilters: boolean;
  isRangeInvalid: boolean;
  // Business the list is filtered by, once loaded; its time zone reads the dates.
  selectedBusiness: NullableRef<BookingBusiness>;
  statusOptions: FilterOption[];
}
