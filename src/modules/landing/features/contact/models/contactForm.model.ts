import type { BaseSyntheticEvent } from "react";
import type { UseFormRegister } from "react-hook-form";
import type { Nullable } from "@/shared/types";
import type { ContactFormData } from "./contactForm.schema";

export interface ContactFormFieldErrors {
  readonly email?: string;
  readonly message?: string;
  readonly name?: string;
  readonly subject?: string;
}

export interface ContactFormViewModel {
  readonly fieldErrors: ContactFormFieldErrors;
  readonly handleDismissFeedback: () => void;
  readonly handleRecaptchaTokenChange: (token: Nullable<string>) => void;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly isSubmitDisabled: boolean;
  readonly isSubmitting: boolean;
  readonly isSuccess: boolean;
  readonly language: "es" | "en";
  readonly recaptchaResetSignal: number;
  readonly recaptchaSiteKey: string;
  readonly register: UseFormRegister<ContactFormData>;
  readonly serverError: Nullable<string>;
}

export interface ContactFormProps {
  readonly className?: string;
  readonly onSubmitSuccess?: () => void;
}
