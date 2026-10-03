import { onAuthStateChanged, type Unsubscribe, type User } from "firebase/auth";
import { auth } from "@/shared/lib/firebase";
import type { Nullable } from "@/shared/types";
import { mapTokenClaimsToSession } from "./mapTokenClaimsToSession";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import type { Session } from "../models/Session.types";

const resolveSession = async (user: Nullable<User>): Promise<Session> => {
  if (!user) return { status: SESSION_STATUS.SIGNED_OUT };

  try {
    const idTokenResult = await user.getIdTokenResult();
    return mapTokenClaimsToSession(user.uid, idTokenResult.claims);
  } catch {
    return { status: SESSION_STATUS.SIGNED_OUT };
  }
};

export const subscribeToSession = (
  onSessionChange: (session: Session) => void,
): Unsubscribe =>
  onAuthStateChanged(auth, (user) => {
    void resolveSession(user).then(onSessionChange);
  });
