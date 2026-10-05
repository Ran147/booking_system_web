import type { FormEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { NullableUndefined } from "@/shared/types";
import type { SubscriberSignUpFormValues } from "./SubscriberSignUpForm.schema";

export type SubscriberSignUpFieldName = keyof SubscriberSignUpFormValues;

/**
 * Contrato del formulario de registro del suscriptor (KAN-25).
 */
export interface SubscriberSignUpFormProps {
  /** Email of the paid checkout; shown read-only (AC-KAN-25-14). */
  readonly checkoutEmail: string;
  /** Sends the sign-up; the form stays disabled while it is pending. */
  readonly onSubmit: (formValues: SubscriberSignUpFormValues) => Promise<void>;
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
  readonly businessAddress: string;
  readonly fieldErrors: SubscriberSignUpFieldErrors;
  readonly fields: SubscriberSignUpFieldRegistrations;
  readonly handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly password: string;
}

/**
 * Propiedades de cada seccion del formulario.
 */
export interface SubscriberSignUpSectionProps {
  readonly fieldErrors: SubscriberSignUpFieldErrors;
  readonly fields: SubscriberSignUpFieldRegistrations;
}
