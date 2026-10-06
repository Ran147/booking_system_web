import type { InputFieldProps } from "@/components/common/input-field/models/inputField.model";

/** Properties accepted by the reusable password input. */
export interface PasswordInputProps extends Omit<InputFieldProps, "type"> {
  readonly visibilityResetKey?: number;
}
