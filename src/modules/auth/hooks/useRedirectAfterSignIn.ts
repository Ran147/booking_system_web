import { useSearchParams } from "react-router";
import { SEARCH_PARAM } from "@/constants";
import { PORTAL_HOME_BY_ROLE } from "../constants/PortalHomeByRole.constants";
import type { ResolveSignInDestination } from "../models/signIn.model";
import { resolveSafeRedirectPath } from "../utils/resolveSafeRedirectPath";

// US-33, D-3: back to a safe redirectTo, otherwise to the role's portal. If
// the role cannot see redirectTo, RequireRole sends it to its own portal.
export const useRedirectAfterSignIn = (): ResolveSignInDestination => {
  const [searchParams] = useSearchParams();
  const safeRedirectPath = resolveSafeRedirectPath(
    searchParams.get(SEARCH_PARAM.REDIRECT_TO),
  );

  return (role) => safeRedirectPath ?? PORTAL_HOME_BY_ROLE[role];
};
