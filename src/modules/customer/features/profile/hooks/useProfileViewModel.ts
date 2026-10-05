import { ERROR_MESSAGE_KEY, VIEW_STATE } from "@/constants";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import { mapFirebaseError } from "@/services/firebase";
import { useCustomerProfileQuery } from "../api/useCustomerProfileQuery";
import type { UseProfileViewModelReturn } from "../models";

export const useProfileViewModel = (): UseProfileViewModelReturn => {
  const session = useSession();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
  const profileQuery = useCustomerProfileQuery(userId);

  const viewState = profileQuery.isPending
    ? VIEW_STATE.LOADING
    : profileQuery.isError
      ? VIEW_STATE.ERROR
      : profileQuery.data
        ? VIEW_STATE.READY
        : VIEW_STATE.EMPTY;

  return {
    errorMessageKey: profileQuery.error
      ? mapFirebaseError(profileQuery.error).messageKey
      : ERROR_MESSAGE_KEY.UNKNOWN,
    profile: profileQuery.data ?? null,
    retry: (): void => {
      void profileQuery.refetch();
    },
    viewState,
  };
};
