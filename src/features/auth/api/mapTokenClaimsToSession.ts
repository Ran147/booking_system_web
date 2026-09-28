import type { ParsedToken } from "firebase/auth";
import { USER_ROLE, type UserRole } from "@/shared/domain";
import type { Nullable } from "@/shared/types";
import { AUTH_CLAIM } from "../constants/AuthClaim.constants";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import type { Session } from "../models/Session.types";

const isUserRole = (claimValue: unknown): claimValue is UserRole =>
  Object.values(USER_ROLE).some((userRole) => userRole === claimValue);

const readStringClaim = (claimValue: unknown): Nullable<string> =>
  typeof claimValue === "string" ? claimValue : null;

// A signed-in account without a known role claim gets no portal access: the
// claim is set by a Cloud Function at subscriber sign-up, customer sign-up or
// when a collaborator accepts the invitation.
export const mapTokenClaimsToSession = (
  userId: string,
  tokenClaims: ParsedToken,
): Session => {
  const roleClaim = tokenClaims[AUTH_CLAIM.ROLE];

  if (!isUserRole(roleClaim)) return { status: SESSION_STATUS.SIGNED_OUT };

  return {
    businessId: readStringClaim(tokenClaims[AUTH_CLAIM.BUSINESS_ID]),
    collaboratorId: readStringClaim(tokenClaims[AUTH_CLAIM.COLLABORATOR_ID]),
    role: roleClaim,
    status: SESSION_STATUS.SIGNED_IN,
    userId,
  };
};
