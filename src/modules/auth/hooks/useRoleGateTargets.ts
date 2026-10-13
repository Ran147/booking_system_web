import { useLocation } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { useSession } from "./useSession";
import { PORTAL_HOME_BY_ROLE } from "../constants/PortalHomeByRole.constants";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import type { RoleGateTargets } from "../models/signIn.model";
import { buildSignInPath } from "../utils/buildSignInPath";

// Where RequireRole redirects (US-33, D-6): a wrong role to its own portal,
// a visitor to sign-in with the current page as redirectTo.
export const useRoleGateTargets = (): RoleGateTargets => {
  const session = useSession();
  const location = useLocation();

  return {
    ownPortalPath:
      session.status === SESSION_STATUS.SIGNED_IN
        ? PORTAL_HOME_BY_ROLE[session.role]
        : ROUTE_PATH.LANDING.HOME,
    signInPath: buildSignInPath(`${location.pathname}${location.search}`),
  };
};
