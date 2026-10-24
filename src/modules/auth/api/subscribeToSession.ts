import { onAuthStateChanged, type Unsubscribe, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { USER_ROLE, type UserRole } from "@/shared/domain";
import { auth, firestore } from "@/shared/lib/firebase";
import type { Nullable } from "@/shared/types";
import { mapTokenClaimsToSession } from "./mapTokenClaimsToSession";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import type { Session } from "../models/Session.types";

const isUserRole = (claimValue: unknown): claimValue is UserRole =>
  Object.values(USER_ROLE).some((userRole) => userRole === claimValue);

const resolveSession = async (user: Nullable<User>): Promise<Session> => {
  if (!user) return { status: SESSION_STATUS.SIGNED_OUT };

  try {
    const idTokenResult = await user.getIdTokenResult();
    const session = mapTokenClaimsToSession(user.uid, idTokenResult.claims);
    if (session.status === SESSION_STATUS.SIGNED_IN) {
      return session;
    }

    const userSnapshot = await getDoc(doc(firestore, "users", user.uid));
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      const role = userData?.role;
      const businessId = (userData?.business_id ||
        userData?.businessId ||
        null) as Nullable<string>;
      if (isUserRole(role)) {
        return {
          businessId,
          collaboratorId: null,
          role,
          status: SESSION_STATUS.SIGNED_IN,
          userId: user.uid,
        };
      }
    }

    return { status: SESSION_STATUS.SIGNED_OUT };
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
