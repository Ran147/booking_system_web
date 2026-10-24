import { generatePath, useNavigate, useParams } from "react-router";
import { ERROR_MESSAGE_KEY, ROUTE_PATH, VIEW_STATE } from "@/constants";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import { mapFirebaseError } from "@/services/firebase";
import { useCustomerProfileQuery } from "../api/useCustomerProfileQuery";
import { NO_CUSTOMER_USER_ID } from "../constants/Profile.constants";
import type { UseProfileViewModelReturn } from "../models";

export const useProfileViewModel = (): UseProfileViewModelReturn => {
  const navigate = useNavigate();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const session = useSession();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN
      ? session.userId
      : NO_CUSTOMER_USER_ID;
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
    handleChangePassword: (): void => {
      if (!businessSlug) return;
      navigate(
        generatePath(
          `${ROUTE_PATH.CUSTOMER.ROOT}/${ROUTE_PATH.CUSTOMER.CHANGE_PASSWORD}`,
          { businessSlug },
        ),
      );
    },
    handleEdit: (): void => {
      if (!businessSlug) return;
      navigate(
        generatePath(
          `${ROUTE_PATH.CUSTOMER.ROOT}/${ROUTE_PATH.CUSTOMER.PROFILE_EDIT}`,
          { businessSlug },
        ),
      );
    },
    profile: profileQuery.data ?? null,
    retry: (): void => {
      void profileQuery.refetch();
    },
    viewState,
  };
};
