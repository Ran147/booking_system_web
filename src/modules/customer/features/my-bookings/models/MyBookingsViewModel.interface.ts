import type { ErrorMessageKey, ViewState } from "@/constants";
import type { MyBookingRow } from "./MyBookingRow.interface";
import type { MyBookingsFiltersViewModel } from "./MyBookingsFiltersViewModel.interface";

export interface MyBookingsViewModel {
  errorMessageKey: ErrorMessageKey;
  filtersViewModel: MyBookingsFiltersViewModel;
  handleNextPage: () => void;
  handlePreviousPage: () => void;
  handleRetry: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageNumber: number;
  rows: MyBookingRow[];
  totalCount: number;
  viewState: ViewState;
}
