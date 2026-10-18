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
  const isEndingSessionReference = useRef(false);
  const currentPath = `${location.pathname}${location.search}`;

  // The one place that ends the session, whether the time ran out here, the
  // person pressed "Sign out" or another tab did it. It runs once at a time;
  // if Firebase could not sign out, the next check tries again.
  const endSession = (shouldTellOtherTabs: boolean): void => {
    if (isEndingSessionReference.current) return;
    isEndingSessionReference.current = true;
    if (shouldTellOtherTabs) broadcastSignedOut();

    void signOutUser({
      reason: SIGN_OUT_REASON.IDLE,
      redirectPath: currentPath,
    }).then((wasSignedOut) => {
      if (!wasSignedOut) isEndingSessionReference.current = false;
    });
  };

  const { broadcastActivity, broadcastActivityNow, broadcastSignedOut } =
    useIdleTabSync({
      onRemoteActivity: (activityAt) => registerActivity(activityAt),
      onRemoteSignedOut: () => endSession(false),
    });
  const { registerActivity, remainingWarningSeconds } = useIdleSession({
    idleTimeoutMinutes,
    onExpire: () => endSession(true),
    onLocalActivity: broadcastActivity,
  });

  // "Stay connected" and closing the warning (Escape, click outside) count as
  // activity here and in the other tabs, which may be counting down to the
  // same sign-out (AC-KAN-38-06).
  const stayConnected = (): void => {
    const activityAt = Date.now();
    registerActivity(activityAt);
    broadcastActivityNow(activityAt);
  };

  if (remainingWarningSeconds === null) return null;

  return (
    <IdleWarningDialog
      onSignOut={() => endSession(true)}
      onStayConnected={stayConnected}
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
