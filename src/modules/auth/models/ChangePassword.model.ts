import {
  CHANGE_PASSWORD_ERROR_CODE,
  type ChangePasswordErrorCode,
} from "../constants/ChangePassword.constants";

/** Credentials required to reauthenticate and update the current Auth user. */
export interface ChangePasswordPayload {
  readonly currentPassword: string;
  readonly newPassword: string;
}

/** Internal change-password error that is not an official Firebase code. */
export interface ChangePasswordError extends Error {
  readonly code: ChangePasswordErrorCode;
}

/** Creates the error used when there is no authenticated user with an email. */
export const createAuthenticatedUserRequiredError = (): ChangePasswordError =>
  Object.assign(
    new Error(CHANGE_PASSWORD_ERROR_CODE.AUTHENTICATED_USER_REQUIRED),
    {
      code: CHANGE_PASSWORD_ERROR_CODE.AUTHENTICATED_USER_REQUIRED,
    },
  );

/** Checks whether a value is the internal authenticated-user-required error. */
export const isChangePasswordError = (
  error: unknown,
): error is ChangePasswordError =>
  error instanceof Error &&
  "code" in error &&
  error.code === CHANGE_PASSWORD_ERROR_CODE.AUTHENTICATED_USER_REQUIRED;
