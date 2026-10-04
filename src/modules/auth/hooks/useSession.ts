import { useContext } from "react";
import { PROVIDER_ERROR } from "@/shared/constants";
import { AuthContext } from "../context/AuthContext";
import type { Session } from "../models/Session.types";

export const useSession = (): Session => {
  const authContextValue = useContext(AuthContext);

  if (!authContextValue) {
    throw new Error(PROVIDER_ERROR.MISSING_AUTH_PROVIDER);
  }

  return authContextValue.session;
};
