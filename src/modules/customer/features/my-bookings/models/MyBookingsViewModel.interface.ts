import type { ErrorMessageKey, ViewState } from "@/constants";
import type { MyBookingsTab } from "../constants";
import type { MyBookingRow } from "./MyBookingRow.interface";

export interface MyBookingsViewModel {
  activeTab: MyBookingsTab;
  errorMessageKey: ErrorMessageKey;
  handleNextPage: () => void;
  handlePreviousPage: () => void;
  handleRetry: () => void;
  handleTabChange: (tabId: string) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageNumber: number;
  rows: MyBookingRow[];
  totalCount: number;
  viewState: ViewState;
}
