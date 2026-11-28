import type { BaseSyntheticEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { Nullable, NullableUndefined } from "@/types";
import type { CustomerSignUpFormValues } from "./CustomerSignUpForm.schema";
import type { VerificationEmailStatus } from "../constants/CustomerSignUp.constants";

/**
 * @file Contratos del registro del cliente (KAN-123).
 */

type CustomerSignUpField = keyof CustomerSignUpFormValues;

/**
 * @typedef {Object} CustomerSignUpViewModel
 * @property {Record<CustomerSignUpField, NullableUndefined<string>>} fieldErrors - Error traducido de cada campo.
 * @property {Record<CustomerSignUpField, UseFormRegisterReturn>} fields - Registro de React Hook Form de cada campo.
 * @property {(recaptchaToken: Nullable<string>) => void} handleRecaptchaTokenChange - Guarda o borra el token del reCAPTCHA.
 * @property {(event?: BaseSyntheticEvent) => Promise<void>} handleSubmit - Valida y crea la cuenta.
 * @property {boolean} isRecaptchaMissing - true mientras no se resuelva el reCAPTCHA (botón desactivado).
 * @property {boolean} isSubmitting - Validando o creando la cuenta.
 * @property {string} language - Idioma del widget de reCAPTCHA.
 * @property {number} recaptchaResetSignal - Cambia para pedir un token nuevo tras un error.
 * @property {string} recaptchaSiteKey - Clave pública del reCAPTCHA.
 * @property {Nullable<string>} submitError - Mensaje traducido del servidor o de la red.
 * @property {Nullable<VerificationEmailStatus>} verificationEmail - Resultado del registro; null mientras se muestra el formulario.
 */
export interface CustomerSignUpViewModel {
  readonly fieldErrors: Readonly<
    Record<CustomerSignUpField, NullableUndefined<string>>
  >;
  readonly fields: Readonly<Record<CustomerSignUpField, UseFormRegisterReturn>>;
  readonly handleRecaptchaTokenChange: (
    recaptchaToken: Nullable<string>,
  ) => void;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly isRecaptchaMissing: boolean;
  readonly isSubmitting: boolean;
  readonly language: string;
  readonly recaptchaResetSignal: number;
  readonly recaptchaSiteKey: string;
  readonly submitError: Nullable<string>;
  readonly verificationEmail: Nullable<VerificationEmailStatus>;
}

/**
 * @typedef {Object} CustomerSignUpFormProps
 * @property {CustomerSignUpViewModel} customerSignUpViewModel - Estado y acciones del formulario.
 */
export interface CustomerSignUpFormProps {
  readonly customerSignUpViewModel: CustomerSignUpViewModel;
}
