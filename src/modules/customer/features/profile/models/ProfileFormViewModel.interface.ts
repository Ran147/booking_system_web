import type { FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ErrorMessageKey, ViewState } from "@/constants";
import type { Nullable } from "@/types";
import type { ProfileFormValues } from "./ProfileForm.schema";

export interface ProfileFormViewModel {
  canSubmit: boolean;
  email: string;
  errorMessageKey: ErrorMessageKey;
  form: UseFormReturn<ProfileFormValues>;
  handleCancel: () => void;
  handleDiscardChanges: () => void;
  handleKeepEditing: () => void;
  handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  isDiscardDialogOpen: boolean;
  isSubmitting: boolean;
  profile: Nullable<ProfileFormValues>;
  retry: () => Promise<unknown>;
  viewState: ViewState;
}
