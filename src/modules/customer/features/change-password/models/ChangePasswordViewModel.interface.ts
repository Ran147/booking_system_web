import type { FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ChangePasswordFormValues } from "./ChangePasswordForm.schema";

export interface ChangePasswordViewModel {
  canSubmit: boolean;
  form: UseFormReturn<ChangePasswordFormValues>;
  handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  handleToggleVisibility: (fieldName: keyof ChangePasswordFormValues) => void;
  isPasswordVisible: Readonly<Record<keyof ChangePasswordFormValues, boolean>>;
  isSubmitting: boolean;
}
