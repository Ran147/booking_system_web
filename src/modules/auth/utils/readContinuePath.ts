import type { Nullable } from "@/types";
import { resolveSafeRedirectPath } from "./resolveSafeRedirectPath";

// continueUrl is the absolute URL the sign-up asked Firebase to put in the
// email: the page to return to after signing in. Only a safe path of this
// site is kept (no open redirects, US-33 D-3); anything else is ignored.
export const readContinuePath = (
  continueUrl: Nullable<string>,
): Nullable<string> => {
  if (!continueUrl || !URL.canParse(continueUrl)) return null;

  const parsedUrl = new URL(continueUrl);
  if (parsedUrl.origin !== window.location.origin) return null;

  return resolveSafeRedirectPath(
    `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`,
  );
};
