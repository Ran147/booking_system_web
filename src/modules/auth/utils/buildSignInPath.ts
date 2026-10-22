import { createSearchParams } from "react-router";
import { ROUTE_PATH, SEARCH_PARAM } from "@/constants";

// Sign-in URL that brings the user back to redirectPath afterwards.
export const buildSignInPath = (redirectPath: string): string =>
  `${ROUTE_PATH.AUTH.SIGN_IN}?${createSearchParams({
    [SEARCH_PARAM.REDIRECT_TO]: redirectPath,
  }).toString()}`;
