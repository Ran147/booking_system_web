import { useEffect, useMemo, useState } from "react";
import { subscribeToSession } from "../api/subscribeToSession";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import type { AuthContextValue } from "../models/AuthContextValue.interface";
import type { Session } from "../models/Session.types";

export const useAuthSessionController = (): AuthContextValue => {
  const [session, setSession] = useState<Session>({
    status: SESSION_STATUS.LOADING,
  });

  useEffect(() => subscribeToSession(setSession), []);

  return useMemo(() => ({ session }), [session]);
};
