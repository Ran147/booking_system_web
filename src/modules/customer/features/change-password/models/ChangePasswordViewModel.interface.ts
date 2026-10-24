import type { FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { NullableRef, NullableUndefined } from "@/types";
import type { ChangePasswordFormValues } from "./ChangePasswordForm.schema";

/** Presentation contract for the customer change-password form. */
export interface ChangePasswordViewModel {
  readonly form: UseFormReturn<ChangePasswordFormValues>;
  readonly handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly newPassword: string;
  readonly resolveFieldErrorMessage: (
    messageKey?: string,
  ) => NullableUndefined<string>;
  readonly submitErrorMessage: NullableRef<string>;
  readonly visibilityResetKey: number;
}
