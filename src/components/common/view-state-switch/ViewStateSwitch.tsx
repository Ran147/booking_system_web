import type { ReactElement } from "react";
import { VIEW_STATE } from "@/shared/constants";
import type { ViewStateSwitchProps } from "./ViewStateSwitchProps.interface";
import { EmptyState } from "../empty-state/EmptyState";
import { ErrorState } from "../error-state/ErrorState";
import { Spinner } from "../spinner/Spinner";

export const ViewStateSwitch = ({
  children,
  emptyMessage,
  errorMessageKey,
  onRetry,
  viewState,
}: ViewStateSwitchProps): ReactElement => {
  const contentByViewState = {
    [VIEW_STATE.EMPTY]: <EmptyState message={emptyMessage} />,
    [VIEW_STATE.ERROR]: (
      <ErrorState messageKey={errorMessageKey} onRetry={onRetry} />
    ),
    [VIEW_STATE.LOADING]: <Spinner />,
    [VIEW_STATE.READY]: <>{children}</>,
  } satisfies Record<typeof viewState, ReactElement>;

  return contentByViewState[viewState];
};
