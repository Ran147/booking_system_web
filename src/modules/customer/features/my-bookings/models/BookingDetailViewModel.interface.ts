import type { ErrorMessageKey, ViewState } from "@/constants";
import type { Nullable } from "@/shared/types";
import type { BookingDetailView } from "./BookingDetailView.interface";

export interface BookingDetailViewModel {
  detail: Nullable<BookingDetailView>;
  errorMessageKey: ErrorMessageKey;
  handleRetry: () => void;
  isRetryable: boolean;
  listPath: string;
  viewState: ViewState;
}
