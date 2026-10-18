import type { BaseSyntheticEvent, RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { Nullable, NullableRef } from "@/types";
import type { PasswordRecoveryFormValues } from "./PasswordRecoveryForm.schema";
import type { PasswordResetErrorKey } from "../constants/PasswordResetErrorKey.constants";

/**
 * @file Contratos de la pantalla de recuperar la contraseña (US-36).
 */

/**
 * @typedef {Object} PasswordRecoveryViewModel
 * @property {UseFormReturn<PasswordRecoveryFormValues>} form - Estado del formulario.
 * @property {(recaptchaToken: Nullable<string>) => void} handleRecaptchaTokenChange - Guarda el token del widget.
 * @property {(event?: BaseSyntheticEvent) => Promise<void>} handleSubmit - Valida y envía.
 * @property {boolean} hasRequestBeenSent - true muestra el mensaje neutro.
 * @property {boolean} isSubmitDisabled - Sin token, enviando o en cuenta atrás.
 * @property {boolean} isSubmitting - Validando o enviando.
 * @property {string} language - Idioma activo para el widget de reCAPTCHA.
 * @property {number} recaptchaResetSignal - Cambia para reiniciar el widget.
 * @property {string} recaptchaSiteKey - Clave pública del sitio.
 * @property {number} remainingCooldownSeconds - 0 significa que puede volver a pedir.
 * @property {RefObject<NullableRef<HTMLDivElement>>} serverErrorAlertReference - Recibe el foco al mostrar un error.
 * @property {Nullable<PasswordResetErrorKey>} serverErrorKey - Mensaje del servidor, si hay.
 */
export interface PasswordRecoveryViewModel {
  readonly form: UseFormReturn<PasswordRecoveryFormValues>;
  readonly handleRecaptchaTokenChange: (
    recaptchaToken: Nullable<string>,
  ) => void;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly hasRequestBeenSent: boolean;
  readonly isSubmitDisabled: boolean;
  readonly isSubmitting: boolean;
  readonly language: string;
  readonly recaptchaResetSignal: number;
  readonly recaptchaSiteKey: string;
  readonly remainingCooldownSeconds: number;
  readonly serverErrorAlertReference: RefObject<NullableRef<HTMLDivElement>>;
  readonly serverErrorKey: Nullable<PasswordResetErrorKey>;
}

/**
 * @typedef {Object} PasswordRecoveryFormProps
 * @property {PasswordRecoveryViewModel} passwordRecoveryViewModel - Estado y acciones del formulario.
 */
export interface PasswordRecoveryFormProps {
  readonly passwordRecoveryViewModel: PasswordRecoveryViewModel;
}
