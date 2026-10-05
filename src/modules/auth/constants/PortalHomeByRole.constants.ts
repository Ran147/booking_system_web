import { ROUTE_PATH } from "@/constants";
import { USER_ROLE, type UserRole } from "@/domain";

// Home of each role's portal: target after sign-in without redirectTo, and of
// RequireRole when a role opens a portal that is not theirs (US-33, D-3).
// P-1: a customer goes to the landing until "my bookings" (KAN-150) exists.
export const PORTAL_HOME_BY_ROLE = Object.freeze({
  [USER_ROLE.COLLABORATOR]: ROUTE_PATH.BUSINESS.ROOT,
  [USER_ROLE.CUSTOMER]: ROUTE_PATH.LANDING.HOME,
  [USER_ROLE.SUBSCRIBER]: ROUTE_PATH.BUSINESS.ROOT,
  [USER_ROLE.SUPER_ADMIN]: ROUTE_PATH.ADMIN.ROOT,
} as const satisfies Record<UserRole, string>);
