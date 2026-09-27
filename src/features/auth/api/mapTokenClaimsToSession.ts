import type { ParsedToken } from "firebase/auth";
import { USER_ROLE, type UserRole } from "@/shared/domain";
import { AUTH_CLAIM } from "../constants/AuthClaim.constants";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import type { Session } from "../models/Session.types";

const isUserRole = (claimValue: unknown): claimValue is UserRole =>
  Object.values(USER_ROLE).some((userRole) => userRole === claimValue);

// A signed-in account without a known role claim gets no portal access: the
// claim is set by a Cloud Function after payment or sign-up.
export const mapTokenClaimsToSession = (
  userId: string,
  tokenClaims: ParsedToken,
): Session => {
  const roleClaim = tokenClaims[AUTH_CLAIM.ROLE];
  const businessIdClaim = tokenClaims[AUTH_CLAIM.BUSINESS_ID];

  if (!isUserRole(roleClaim)) return { status: SESSION_STATUS.SIGNED_OUT };

  return {
    businessId: typeof businessIdClaim === "string" ? businessIdClaim : null,
    role: roleClaim,
    status: SESSION_STATUS.SIGNED_IN,
    userId,
  };
};
