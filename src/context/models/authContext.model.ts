import type { Session } from "@/modules/auth/models/Session.types";

/**
 * @typedef {Object} AuthContextValue
 * @property {Session} session - Estado de sesion autenticada actual
 * @property {() => Promise<void>} signOut - Cierra la sesion del usuario
 */
export interface AuthContextValue {
  session: Session;
  signOut: () => Promise<void>;
}
