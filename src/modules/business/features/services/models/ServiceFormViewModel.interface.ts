import type { FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ErrorMessageKey } from "@/constants";
import type { Nullable } from "@/types";
import type { ServiceFormValues } from "./ServiceForm.schema";

export interface ServiceFormViewModel {
  readonly canAddFeature: boolean;
  readonly form: UseFormReturn<ServiceFormValues>;
  readonly handleAddFeature: () => void;
  readonly handleFeatureChange: (index: number, value: string) => void;
  readonly handleFileSelect: (file: Nullable<File>) => void | Promise<void>;
  readonly handleMoveFeatureDown: (index: number) => void;
  readonly handleMoveFeatureUp: (index: number) => void;
  readonly handleRemoveFeature: (index: number) => void;
  readonly handleRemoveImage: () => void;
  readonly handleRetryLoad: () => void;
  readonly handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  readonly imageError: Nullable<string>;
  readonly isEditMode: boolean;
  readonly isLoadError: boolean;
  readonly isLoading: boolean;
  readonly isReadOnly: boolean;
  readonly isSubmitting: boolean;
  readonly loadErrorMessageKey: Nullable<ErrorMessageKey>;
  readonly selectedImagePreview: Nullable<string>;
}
