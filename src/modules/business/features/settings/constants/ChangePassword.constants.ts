export const CHANGE_PASSWORD_FORM_MODE = Object.freeze({
  VALIDATION: "onBlur",
} as const);

export {
  CHANGE_PASSWORD_ERROR_CODE,
  CHANGE_PASSWORD_ERROR_KEY,
  DEFAULT_CHANGE_PASSWORD_VALUES,
  type ChangePasswordErrorCode,
} from "@/modules/auth/constants/ChangePassword.constants";
