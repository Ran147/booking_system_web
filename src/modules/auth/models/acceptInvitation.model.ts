import type { FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { Nullable, NullableRef } from "@/types";
import type { AcceptInvitationFormValues } from "./AcceptInvitationForm.schema";
import type {
  AcceptInvitationErrorKey,
  AcceptInvitationLinkState,
} from "../constants/AcceptInvitation.constants";

/**
 * @file Contratos e interfaces para la pantalla de aceptacion de invitacion de colaborador (KAN-79).
 */

/**
 * @typedef {Object} AcceptInvitationViewModel
 * @property {string} businessName - Nombre del negocio que invito al colaborador.
 * @property {string} email - Correo del colaborador invitado (solo lectura).
 * @property {UseFormReturn<AcceptInvitationFormValues>} form - Formulario controlado por React Hook Form.
 * @property {(token: Nullable<string>) => void} handleRecaptchaTokenChange - Actualiza el token reCAPTCHA.
 * @property {(event: FormEvent<HTMLFormElement>) => void} handleSubmit - Valida y envia la activacion.
 * @property {() => void} handleToggleConfirmationVisibility - Muestra u oculta la confirmacion.
 * @property {() => void} handleTogglePasswordVisibility - Muestra u oculta la contrasena.
 * @property {boolean} isConfirmationVisible - Visibilidad del campo confirmacion.
 * @property {boolean} isPasswordVisible - Visibilidad del campo contrasena.
 * @property {boolean} isSubmitDisabled - Deshabilita envio hasta completar reCAPTCHA o mientras envia.
 * @property {boolean} isSubmitting - Indica peticion de activacion en curso.
 * @property {string} language - Idioma activo de la interfaz.
 * @property {AcceptInvitationLinkState} linkState - Estado de validacion del enlace de invitacion.
 * @property {string} newPassword - Valor actual de la nueva contrasena para el medidor.
 * @property {number} recaptchaResetSignal - Contador para reiniciar el widget reCAPTCHA tras error.
 * @property {string} recaptchaSiteKey - Clave publica de reCAPTCHA.
 * @property {() => void} retryLinkCheck - Reintenta validar la invitacion ante error de red.
 * @property {React.RefObject<NullableRef<HTMLDivElement>>} serverErrorAlertReference - Referencia al alerta de error.
 * @property {Nullable<AcceptInvitationErrorKey>} serverErrorKey - Clave i18n del error de servidor.
 */
export interface AcceptInvitationViewModel {
  readonly businessName: string;
  readonly email: string;
  readonly form: UseFormReturn<AcceptInvitationFormValues>;
  readonly handleRecaptchaTokenChange: (token: Nullable<string>) => void;
  readonly handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly handleToggleConfirmationVisibility: () => void;
  readonly handleTogglePasswordVisibility: () => void;
  readonly isConfirmationVisible: boolean;
  readonly isPasswordVisible: boolean;
  readonly isSubmitDisabled: boolean;
  readonly isSubmitting: boolean;
  readonly language: string;
  readonly linkState: AcceptInvitationLinkState;
  readonly newPassword: string;
  readonly recaptchaResetSignal: number;
  readonly recaptchaSiteKey: string;
  readonly retryLinkCheck: () => void;
  readonly serverErrorAlertReference: React.RefObject<
    NullableRef<HTMLDivElement>
  >;
  readonly serverErrorKey: Nullable<AcceptInvitationErrorKey>;
}

/**
 * @typedef {Object} AcceptInvitationFormProps
 * @property {AcceptInvitationViewModel} acceptInvitationViewModel - ViewModel del flujo de aceptacion.
 */
export interface AcceptInvitationFormProps {
  readonly acceptInvitationViewModel: AcceptInvitationViewModel;
}

/**
 * @typedef {Object} AcceptInvitationLinkNoticeProps
 * @property {() => void} onRetry - Accion para reintentar la validacion.
 * @property {boolean} shouldOfferRetry - True cuando el fallo fue de red.
 */
export interface AcceptInvitationLinkNoticeProps {
  readonly onRetry: () => void;
  readonly shouldOfferRetry: boolean;
}
