import type { ReactElement, ReactNode } from "react";
import { AuthContext } from "../context/AuthContext";
import { useAuthSessionController } from "../hooks/useAuthSessionController";

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): ReactElement => {
  const authContextValue = useAuthSessionController();

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
