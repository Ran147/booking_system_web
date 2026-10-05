import type { ChangePasswordErrorCode } from "../constants";

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordError {
  code: ChangePasswordErrorCode;
}
