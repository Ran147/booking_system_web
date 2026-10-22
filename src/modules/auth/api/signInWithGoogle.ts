import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { USER_ROLE, type UserRole } from "@/domain";
import { auth, firestore } from "@/services/firebase";
import type { Nullable } from "@/types";
import { fetchUserLanguage } from "./fetchUserLanguage";
import { mapTokenClaimsToSession } from "./mapTokenClaimsToSession";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import { SIGN_IN_FAILURE } from "../constants/SignInErrorKey.constants";
import type { SignInResponse } from "../models/SignIn.mutation";

const isUserRole = (claimValue: unknown): claimValue is UserRole =>
  Object.values(USER_ROLE).some((userRole) => userRole === claimValue);

/**
 * Autentica al usuario mediante una ventana emergente de Google.
 * Valida los custom claims requeridos por el rol del usuario.
 */
export const signInWithGoogle = async (): Promise<SignInResponse> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const { user } = await signInWithPopup(auth, provider);
  const idTokenResult = await user.getIdTokenResult(true);
  let session = mapTokenClaimsToSession(user.uid, idTokenResult.claims);

  if (session.status !== SESSION_STATUS.SIGNED_IN) {
    try {
      const userSnapshot = await getDoc(doc(firestore, "users", user.uid));
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const role = userData?.role;
        const businessId = (userData?.business_id ||
          userData?.businessId ||
          null) as Nullable<string>;
        if (isUserRole(role)) {
          session = {
            businessId,
            collaboratorId: null,
            role,
            status: SESSION_STATUS.SIGNED_IN,
            userId: user.uid,
          };
        }
      }
    } catch {
      // Ignora error de lectura y procede a cerrar sesion
    }
  }

  if (session.status !== SESSION_STATUS.SIGNED_IN) {
    await signOut(auth);
    throw new Error(SIGN_IN_FAILURE.MISSING_ROLE_CLAIM);
  }

  const language = await fetchUserLanguage(user.uid).catch(() => null);

  return { language, session };
};
