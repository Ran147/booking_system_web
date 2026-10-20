import {
  CHANGE_PASSWORD_ERROR_CODE,
  type ChangePasswordErrorCode,
} from "../constants/ChangePassword.constants";

/** Error interno de KAN-53 que no representa un código oficial de Firebase. */
export interface ChangePasswordError extends Error {
  readonly code: ChangePasswordErrorCode;
}

/** Crea el error interno utilizado cuando no hay una sesión con correo válida. */
export const createAuthenticatedUserRequiredError = (): ChangePasswordError =>
  Object.assign(
    new Error(CHANGE_PASSWORD_ERROR_CODE.AUTHENTICATED_USER_REQUIRED),
    {
      code: CHANGE_PASSWORD_ERROR_CODE.AUTHENTICATED_USER_REQUIRED,
    },
  );

/** Comprueba si un valor corresponde a un error interno de cambio de contraseña. */
export const isChangePasswordError = (
  error: unknown,
): error is ChangePasswordError =>
  error instanceof Error &&
  "code" in error &&
  error.code === CHANGE_PASSWORD_ERROR_CODE.AUTHENTICATED_USER_REQUIRED;
