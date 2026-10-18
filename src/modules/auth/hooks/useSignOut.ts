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
 * "colgado" con datos privados a la vista. Primero se navega y después se
 * limpia la caché, para que la página protegida no vuelva a pedir sus datos
 * sin sesión. Responde si Firebase cerró la sesión, para que quien llama
 * pueda reintentar.
 * @returns {(options?: SignOutOptions) => Promise<boolean>}
 */
export const useSignOut = (): ((
  options?: SignOutOptions,
) => Promise<boolean>) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async ({
    reason,
    redirectPath,
  }: SignOutOptions = {}): Promise<boolean> => {
    let wasSignedOut = true;
    try {
      await signOut(auth);
    } catch {
      // Cleared and navigated below either way; the caller can try again.
      wasSignedOut = false;
    }

    const locationState: SignOutLocationState = { reason };
    await navigate(
      redirectPath ? buildSignInPath(redirectPath) : ROUTE_PATH.AUTH.SIGN_IN,
      { replace: true, state: locationState },
    );
    queryClient.clear();

    return wasSignedOut;
  };
};
