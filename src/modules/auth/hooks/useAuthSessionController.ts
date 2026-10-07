import { useEffect, useMemo, useState } from "react";
import { ENV_FLAG } from "@/constants";
import { USER_ROLE } from "@/domain";
import { subscribeToSession } from "../api/subscribeToSession";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import type { AuthContextValue } from "../models/AuthContextValue.interface";
import type { Session } from "../models/Session.types";

const DEV_MOCK_SUBSCRIBER_SESSION: Session = {
  businessId: "business-test",
  collaboratorId: null,
  role: USER_ROLE.SUBSCRIBER,
  status: SESSION_STATUS.SIGNED_IN,
  userId: "subscriber-test",
};

export const useAuthSessionController = (): AuthContextValue => {
  const shouldUseDevMockSession = Boolean(
    import.meta.env.DEV &&
    !import.meta.env.VITEST &&
    import.meta.env.VITE_USE_EMULATORS !== ENV_FLAG.ENABLED,
  );

  const [session, setSession] = useState<Session>(() =>
    shouldUseDevMockSession
      ? DEV_MOCK_SUBSCRIBER_SESSION
      : { status: SESSION_STATUS.LOADING },
  );

  useEffect(() => {
    if (shouldUseDevMockSession) return;
    return subscribeToSession(setSession);
  }, [shouldUseDevMockSession]);

  return useMemo(() => ({ session }), [session]);
};
