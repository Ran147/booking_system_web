/**
 * @typedef {Object} PasswordRecoveryLocationState
 * @property {string} [email] - Correo escrito en el login; viaja en el state del router, nunca en la URL (AC-KAN-36-01).
 */
export interface PasswordRecoveryLocationState {
  readonly email?: string;
}
