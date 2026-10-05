import type { ChangePasswordFormValues } from "./ChangePasswordForm.schema";
import type { ChangePasswordViewModel } from "./ChangePasswordViewModel.interface";

export interface PasswordInputProps {
  disabled: boolean;
  label: string;
  name: keyof ChangePasswordFormValues;
  viewModel: ChangePasswordViewModel;
}
