import { STRING } from "@/constants";
import type { PasswordRecoveryFormValues } from "../models/PasswordRecoveryForm.schema";

export const DEFAULT_PASSWORD_RECOVERY_FORM_VALUES = Object.freeze({
  email: STRING.EMPTY,
} as const satisfies PasswordRecoveryFormValues);
