import { ROUTE_PATH } from "@/constants";
import type { Nullable } from "@/types";
import { SAFE_REDIRECT } from "../constants/SafeRedirect.constants";

const isSameSitePath = (redirectPath: string): boolean =>
  redirectPath.startsWith(SAFE_REDIRECT.INTERNAL_PATH_PREFIX) &&
  !redirectPath.startsWith(SAFE_REDIRECT.PROTOCOL_RELATIVE_PREFIX) &&
  !redirectPath.includes(SAFE_REDIRECT.BACKSLASH);

// Returns redirectTo only when it is a path of this site, so the sign-in page
// cannot be used as an open redirect (US-33, D-3). Sign-in itself is
// rejected to avoid a loop.
export const resolveSafeRedirectPath = (
  rawRedirectPath: Nullable<string>,
): Nullable<string> => {
  if (!rawRedirectPath || !isSameSitePath(rawRedirectPath)) return null;

  const redirectUrl = new URL(rawRedirectPath, window.location.origin);
  if (
    redirectUrl.origin !== window.location.origin ||
    redirectUrl.pathname === ROUTE_PATH.AUTH.SIGN_IN
  ) {
    return null;
  }

  return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
};
