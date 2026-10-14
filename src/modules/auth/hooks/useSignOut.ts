import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router";
import { ROUTE_PATH } from "@/constants";
import { auth } from "@/services/firebase";
import type { SignOutLocationState } from "../models/SignOutLocationState.interface";
import type { SignOutOptions } from "../models/idleSession.model";
import { buildSignInPath } from "../utils/buildSignInPath";

/**
 * Cierra la sesión, limpia los datos en caché y lleva al login (KAN-42, US-38).
 * Si Firebase falla igualmente se limpia y se navega: el usuario no queda
 * "colgado" con datos privados a la vista.
 * @returns {(options?: SignOutOptions) => Promise<void>}
 */
export const useSignOut = (): ((options?: SignOutOptions) => Promise<void>) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async ({
    reason,
    redirectPath,
  }: SignOutOptions = {}): Promise<void> => {
    try {
      await signOut(auth);
    } catch {
      // Cleared below either way.
    }
    queryClient.clear();

    const locationState: SignOutLocationState = { reason };
    void navigate(
      redirectPath ? buildSignInPath(redirectPath) : ROUTE_PATH.AUTH.SIGN_IN,
      { replace: true, state: locationState },
    );
  };
};
