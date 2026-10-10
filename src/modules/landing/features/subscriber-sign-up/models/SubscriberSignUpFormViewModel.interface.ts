import type { FormEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { Nullable, NullableUndefined } from "@/shared/types";
import type { SubscriberSignUpFormValues } from "./SubscriberSignUpForm.schema";

export type SubscriberSignUpFieldName = keyof SubscriberSignUpFormValues;

/**
 * Contrato del formulario de registro del suscriptor (KAN-25).
 */
export interface SubscriberSignUpFormProps {
  /** Email of the paid checkout; shown read-only (AC-KAN-25-14). */
  readonly checkoutEmail: string;
  /** Called once the account and the business exist (KAN-27). */
  readonly onSignUpComplete: (email: string) => void;
  /** Token of the sign-up link; every server call needs it. */
  readonly signUpToken: string;
}

/**
 * Error of a submit that the server rejected, shown above the submit button.
 */
export interface SignUpSubmitError {
  readonly message: string;
  /** Account exists (AS-5): links to sign-in and password recovery. */
  readonly showAccountLinks: boolean;
}

/**
 * Translated error of each field, absent when the field is valid.
 */
export type SubscriberSignUpFieldErrors = Readonly<
  Record<SubscriberSignUpFieldName, NullableUndefined<string>>
>;

/**
 * Registration of each field in React Hook Form.
 */
export type SubscriberSignUpFieldRegistrations = Readonly<
  Record<
    SubscriberSignUpFieldName,
    UseFormRegisterReturn<SubscriberSignUpFieldName>
  >
>;

/**
 * Resultado del ViewModel del formulario de registro.
 */
export interface SubscriberSignUpFormViewModel {
  /** Address "/<slug>" and the availability of the slug (AC-KAN-25-15). */
  readonly businessSlugHelperText: string;
  readonly fieldErrors: SubscriberSignUpFieldErrors;
  readonly fields: SubscriberSignUpFieldRegistrations;
  readonly handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly password: string;
  readonly submitError: Nullable<SignUpSubmitError>;
}

/**
 * Propiedades de cada seccion del formulario.
 */
export interface SubscriberSignUpSectionProps {
  readonly fieldErrors: SubscriberSignUpFieldErrors;
  readonly fields: SubscriberSignUpFieldRegistrations;
}
