import { useParams } from "react-router";
import { STRING, VIEW_STATE } from "@/constants";
import { mapFirebaseError } from "@/services/firebase/mapFirebaseError";
import { useCustomerPersonalProfileQuery } from "../api/useCustomerPersonalProfileQuery";
import type { CustomerProfileViewModel } from "../models";

export const useCustomerProfileViewModel = (): CustomerProfileViewModel => {
  const { businessSlug = STRING.EMPTY } = useParams<{ businessSlug: string }>();
  const profileQuery = useCustomerPersonalProfileQuery();
  const viewState = profileQuery.isPending
    ? VIEW_STATE.LOADING
    : profileQuery.isError
      ? VIEW_STATE.ERROR
      : profileQuery.data
        ? VIEW_STATE.READY
        : VIEW_STATE.EMPTY;

  return {
    backPath: `/${businessSlug}`,
    errorMessageKey: mapFirebaseError(profileQuery.error).messageKey,
    handleRetry: (): void => {
      if (!profileQuery.isFetching) void profileQuery.refetch();
    },
    isFetching: profileQuery.isFetching,
    profile:
      viewState === VIEW_STATE.READY ? (profileQuery.data ?? null) : null,
    viewState,
  };
};
