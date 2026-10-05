import type { ReactNode } from "react";
import type { ErrorMessageKey, ViewState } from "@/shared/constants";

export interface ViewStateSwitchProps {
  children: ReactNode;
  emptyMessage: string;
  errorMessageKey?: ErrorMessageKey;
  onRetry?: () => void;
  viewState: ViewState;
}
