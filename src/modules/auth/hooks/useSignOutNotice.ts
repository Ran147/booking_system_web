import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Nullable } from "@/types";
import { SIGN_OUT_REASON } from "../constants/IdleSession.constants";
import type { SignOutLocationState } from "../models/SignOutLocationState.interface";

/**
 * Dice si la persona llegó al login porque se cerró su sesión por inactividad
 * (AC-KAN-38-03). El aviso se lee una sola vez y se borra del state del
 * router, así no reaparece al recargar ni al volver con "atrás".
 * @returns {boolean} true mientras hay que mostrar el aviso.
 */
export const useSignOutNotice = (): boolean => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasClearedStateReference = useRef(false);
  const [wasSignedOutByInactivity] = useState(
    () =>
      (location.state as Nullable<SignOutLocationState>)?.reason ===
      SIGN_OUT_REASON.IDLE,
  );

  useEffect(() => {
    if (!wasSignedOutByInactivity || hasClearedStateReference.current) return;
    hasClearedStateReference.current = true;
    void navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, navigate, wasSignedOutByInactivity]);

  return wasSignedOutByInactivity;
};
