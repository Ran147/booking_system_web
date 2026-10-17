import type { SignOutReason } from "../constants/IdleSession.constants";

/**
 * @typedef {Object} SignOutLocationState
 * @property {SignOutReason} [reason] - Por qué se cerró la sesión; sign-in muestra el aviso una sola vez.
 */
export interface SignOutLocationState {
  readonly reason?: SignOutReason;
}
