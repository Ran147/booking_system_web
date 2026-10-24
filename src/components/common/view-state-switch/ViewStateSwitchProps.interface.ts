import type { ReactNode } from "react";
import type { ViewState } from "@/shared/constants";

export interface ViewStateSwitchProps {
  children: ReactNode;
  emptyMessage: string;
  viewState: ViewState;
}
