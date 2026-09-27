import { PROVIDER_ERROR } from "@/shared/constants";
import { USER_ROLE } from "@/shared/domain";
import { useSession } from "./useSession";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import type { CurrentBusiness } from "../models/CurrentBusiness.interface";

export const useCurrentBusiness = (): CurrentBusiness => {
  const session = useSession();

  if (
    session.status !== SESSION_STATUS.SIGNED_IN ||
    session.role !== USER_ROLE.SUBSCRIBER ||
    !session.businessId
  ) {
    throw new Error(PROVIDER_ERROR.MISSING_CURRENT_BUSINESS);
  }

  return { businessId: session.businessId };
};
