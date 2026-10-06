import type { FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PasswordRuleItem } from "@/components";
import type { Nullable, NullableUndefined } from "@/types";
import type { ChangePasswordFormValues } from "./ChangePasswordForm.schema";

/** State and actions exposed by the change-password form ViewModel. */
export interface ChangePasswordFormViewModel {
  readonly form: UseFormReturn<ChangePasswordFormValues>;
  readonly handleSubmit: (
    formEvent?: FormEvent<HTMLFormElement>,
  ) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly passwordRules: readonly PasswordRuleItem[];
  readonly passwordStrengthLabel: string;
  readonly resolveFieldErrorMessage: (
    messageKey?: NullableUndefined<string>,
  ) => NullableUndefined<string>;
  readonly submitErrorMessage: Nullable<string>;
  readonly visibilityResetKey: number;
}
