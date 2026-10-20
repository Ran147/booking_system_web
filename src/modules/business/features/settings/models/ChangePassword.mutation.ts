/** Credentials required to reauthenticate and update the current Auth user. */
export interface ChangePasswordPayload {
  readonly currentPassword: string;
  readonly newPassword: string;
}
