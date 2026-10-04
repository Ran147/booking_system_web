import type { UseQueryResult } from "@tanstack/react-query";
import { VIEW_STATE, type ViewState } from "@/shared/constants";

export const resolveViewState = (
  queryResult: Pick<UseQueryResult, "isError" | "isPending">,
  itemCount: number,
): ViewState => {
  if (queryResult.isPending) return VIEW_STATE.LOADING;
  if (queryResult.isError) return VIEW_STATE.ERROR;
  return itemCount === 0 ? VIEW_STATE.EMPTY : VIEW_STATE.READY;
};
