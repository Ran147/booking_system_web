import { USER_ROLE, type UserRole } from "@/domain";

export const BUSINESS_PROFILE_ALLOWED_ROLES = Object.freeze([
  USER_ROLE.BUSINESS_OWNER,
  USER_ROLE.SUBSCRIBER,
] as const satisfies readonly UserRole[]);

export const canManageBusinessProfile = (role: UserRole): boolean =>
  BUSINESS_PROFILE_ALLOWED_ROLES.some((allowedRole) => allowedRole === role);
