import type { ReactElement } from "react";
import { Navigate, Outlet } from "react-router";
import { Spinner } from "@/components/common";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import { useRedirectAfterSignIn } from "../hooks/useRedirectAfterSignIn";
import { useSession } from "../hooks/useSession";

// Wraps sign-in (and sign-up later): a signed-in user goes where sign-in
// would have sent them (AC-KAN-33-07).
export const GuestOnly = (): ReactElement => {
  const session = useSession();
  const resolveSignInDestination = useRedirectAfterSignIn();

  if (session.status === SESSION_STATUS.LOADING) return <Spinner />;
  if (session.status === SESSION_STATUS.SIGNED_IN) {
    return <Navigate replace to={resolveSignInDestination(session.role)} />;
  }
  return <Outlet />;
};
