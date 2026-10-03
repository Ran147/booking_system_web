import { PROVIDER_ERROR } from "@/shared/constants";
import { USER_ROLE, type UserRole } from "@/shared/domain";
import { useSession } from "./useSession";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import type { CurrentBusiness } from "../models/CurrentBusiness.interface";

// Roles that work inside one business, taken from the businessId claim.
const BUSINESS_PORTAL_ROLES: readonly UserRole[] = [
  USER_ROLE.COLLABORATOR,
  USER_ROLE.SUBSCRIBER,
];

export const useCurrentBusiness = (): CurrentBusiness => {
  const session = useSession();

  if (
    session.status !== SESSION_STATUS.SIGNED_IN ||
    !BUSINESS_PORTAL_ROLES.includes(session.role) ||
    !session.businessId
  ) {
    throw new Error(PROVIDER_ERROR.MISSING_CURRENT_BUSINESS);
  }

  return { businessId: session.businessId };
};
