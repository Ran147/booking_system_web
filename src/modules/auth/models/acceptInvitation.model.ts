import type { BaseSyntheticEvent, RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { Language } from "@/constants";
import type { Nullable, NullableRef } from "@/types";
import type { AcceptInvitationFormValues } from "./AcceptInvitationForm.schema";
import type {
  InvitationErrorKey,
  InvitationLinkState,
} from "../constants/InvitationLink.constants";

/**
 * @file Contratos de la pantalla de aceptar invitacion de colaborador (KAN-79).
 */

/**
 * @typedef {Object} ValidateInvitationResponse
 * @property {string} businessName - Nombre del negocio que invita.
 * @property {string} email - Correo electronico del colaborador invitado.
 */
export interface ValidateInvitationResponse {
  readonly businessName: string;
  readonly email: string;
}

/**
 * @typedef {Object} AcceptInvitationPayload
 * @property {string} invitationToken - Token de un solo uso recibido en el enlace.
 * @property {string} password - Contraseña definida por el colaborador.
 * @property {string} recaptchaToken - Token de verificacion reCAPTCHA.
 */
export interface AcceptInvitationPayload {
  readonly invitationToken: string;
  readonly password: string;
  readonly recaptchaToken: string;
}

/**
 * @typedef {Object} AcceptInvitationResponse
 * @property {string} email - Correo del colaborador activado.
 * @property {string} status - Estado resultante de la cuenta.
 */
export interface AcceptInvitationResponse {
  readonly email: string;
  readonly status: string;
}

/**
 * @typedef {Object} AcceptInvitationError
 * @property {InvitationErrorKey} messageKey - Clave de i18n del error mapeado.
 */
export interface AcceptInvitationError {
  readonly messageKey: InvitationErrorKey;
}

/**
 * @typedef {Object} AcceptInvitationViewModel
 * @property {string} businessName - Nombre del negocio invitado.
 * @property {string} email - Correo invitado mostrado en contexto.
 * @property {UseFormReturn<AcceptInvitationFormValues>} form - Formulario controlado por RHF.
 * @property {(token: Nullable<string>) => void} handleRecaptchaTokenChange - Registra token reCAPTCHA.
 * @property {(event?: BaseSyntheticEvent) => Promise<void>} handleSubmit - Envia activacion de cuenta.
 * @property {() => void} handleToggleConfirmationVisibility - Alterna visibilidad de confirmacion.
 * @property {() => void} handleTogglePasswordVisibility - Alterna visibilidad de contraseña.
 * @property {boolean} isConfirmationVisible - Estado de visibilidad de confirmacion.
 * @property {boolean} isPasswordVisible - Estado de visibilidad de contraseña.
 * @property {boolean} isSubmitDisabled - Deshabilita envio hasta completar reCAPTCHA.
 * @property {boolean} isSubmitting - Indica envio en curso.
 * @property {Language} language - Idioma actual para reCAPTCHA.
 * @property {InvitationLinkState} linkState - Estado de validacion del enlace.
 * @property {string} newPassword - Valor actual para medidor de seguridad.
 * @property {number} recaptchaResetSignal - Incrementa tras error para reiniciar widget.
 * @property {string} recaptchaSiteKey - Clave publica reCAPTCHA.
 * @property {() => void} retryLinkCheck - Reintenta validacion tras error de red.
 * @property {RefObject<NullableRef<HTMLDivElement>>} serverErrorAlertReference - Referencia para foco en alerta.
 * @property {Nullable<InvitationErrorKey>} serverErrorKey - Clave del error del servidor.
 */
export interface AcceptInvitationViewModel {
  readonly businessName: string;
  readonly email: string;
  readonly form: UseFormReturn<AcceptInvitationFormValues>;
  readonly handleRecaptchaTokenChange: (token: Nullable<string>) => void;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly handleToggleConfirmationVisibility: () => void;
  readonly handleTogglePasswordVisibility: () => void;
  readonly isConfirmationVisible: boolean;
  readonly isPasswordVisible: boolean;
  readonly isSubmitDisabled: boolean;
  readonly isSubmitting: boolean;
  readonly language: Language;
  readonly linkState: InvitationLinkState;
  readonly newPassword: string;
  readonly recaptchaResetSignal: number;
  readonly recaptchaSiteKey: string;
  readonly retryLinkCheck: () => void;
  readonly serverErrorAlertReference: RefObject<NullableRef<HTMLDivElement>>;
  readonly serverErrorKey: Nullable<InvitationErrorKey>;
}

/**
 * @typedef {Object} AcceptInvitationFormProps
 * @property {AcceptInvitationViewModel} viewModel - ViewModel del formulario de invitacion.
 */
export interface AcceptInvitationFormProps {
  readonly viewModel: AcceptInvitationViewModel;
}
