import type { FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ErrorMessageKey, ViewState } from "@/constants";
import type { Nullable } from "@/types";
import type { ProfileFormValues } from "./ProfileForm.schema";

/** Public state and actions used by the customer profile edit page. */
export interface ProfileFormViewModel {
  readonly canSubmit: boolean;
  readonly email: string;
  readonly errorMessageKey: ErrorMessageKey;
  readonly form: UseFormReturn<ProfileFormValues>;
  readonly handleCancel: () => void;
  readonly handleDiscardChanges: () => void;
  readonly handleKeepEditing: () => void;
  readonly handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  readonly isDiscardDialogOpen: boolean;
  readonly isSubmitting: boolean;
  readonly profile: Nullable<ProfileFormValues>;
  readonly retry: () => Promise<unknown>;
  readonly viewState: ViewState;
}
