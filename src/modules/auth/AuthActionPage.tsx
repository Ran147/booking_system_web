import type { ReactElement } from "react";
import { Navigate, useSearchParams } from "react-router";
import { ROUTE_PATH, SEARCH_PARAM } from "@/constants";
import { EmailVerificationCard } from "./components/EmailVerificationCard";
import { AUTH_ACTION_MODE } from "./constants/AuthAction.constants";

// The one action URL of every Firebase email (KAN-126, spec D4). A reset link
// goes on to the US-36 page with the same query; a verification link is
// applied here; any other mode ends in the "invalid link" notice.
export const AuthActionPage = (): ReactElement => {
  const [searchParameters] = useSearchParams();

  if (
    searchParameters.get(SEARCH_PARAM.MODE) === AUTH_ACTION_MODE.RESET_PASSWORD
  ) {
    return (
      <Navigate
        replace
        to={`${ROUTE_PATH.AUTH.PASSWORD_RESET}?${searchParameters.toString()}`}
      />
    );
  }

  return <EmailVerificationCard />;
};
