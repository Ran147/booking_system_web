import { useRef, type ReactElement } from "react";
import { useLocation } from "react-router";
import type { Nullable } from "@/types";
import { IdleWarningDialog } from "./IdleWarningDialog";
import { SIGN_OUT_REASON } from "../constants/IdleSession.constants";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import { useIdleSession } from "../hooks/useIdleSession";
import { useIdleTabSync } from "../hooks/useIdleTabSync";
import { useIdleTimeoutMinutes } from "../hooks/useIdleTimeoutMinutes";
import { useSession } from "../hooks/useSession";
import { useSignOut } from "../hooks/useSignOut";

const SignedInIdleSessionGuard = (): Nullable<ReactElement> => {
  const location = useLocation();
  const signOutUser = useSignOut();
  const idleTimeoutMinutes = useIdleTimeoutMinutes();
  const hasSignedOutReference = useRef(false);
  const currentPath = `${location.pathname}${location.search}`;

  // Runs once: both the local timeout and a sign-out from another tab end here.
  const signOutByInactivity = (): void => {
    if (hasSignedOutReference.current) return;
    hasSignedOutReference.current = true;
    void signOutUser({
      reason: SIGN_OUT_REASON.IDLE,
      redirectPath: currentPath,
    });
  };

  const { broadcastActivity, broadcastSignedOut } = useIdleTabSync({
    onRemoteActivity: (activityAt) => registerActivity(activityAt),
    onRemoteSignedOut: signOutByInactivity,
  });
  const { registerActivity, remainingWarningSeconds } = useIdleSession({
    idleTimeoutMinutes,
    onExpire: () => {
      broadcastSignedOut();
      signOutByInactivity();
    },
    onLocalActivity: broadcastActivity,
  });

  if (remainingWarningSeconds === null) return null;

  return (
    <IdleWarningDialog
      onSignOut={() => {
        broadcastSignedOut();
        signOutByInactivity();
      }}
      onStayConnected={() => registerActivity()}
      remainingSeconds={remainingWarningSeconds}
    />
  );
};

// Mounted once inside the router. Visitors and a session still loading see
// nothing (AC-KAN-133-04).
export const IdleSessionGuard = (): Nullable<ReactElement> => {
  const session = useSession();

  if (session.status !== SESSION_STATUS.SIGNED_IN) return null;
  return <SignedInIdleSessionGuard />;
};
