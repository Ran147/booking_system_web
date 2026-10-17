import type { BaseSyntheticEvent, RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { Nullable, NullableRef } from "@/types";
import type { PasswordResetFormValues } from "./PasswordResetForm.schema";
import type { PasswordResetErrorKey } from "../constants/PasswordResetErrorKey.constants";
import type { PasswordResetLinkState } from "../constants/PasswordResetLink.constants";

/**
 * @file Contratos de la pantalla de definir la contraseña nueva (US-36, KAN-37).
 */

/**
 * @typedef {Object} PasswordResetViewModel
 * @property {UseFormReturn<PasswordResetFormValues>} form - Estado del formulario.
 * @property {(event?: BaseSyntheticEvent) => Promise<void>} handleSubmit - Valida y guarda.
 * @property {() => void} handleToggleConfirmationVisibility - Muestra u oculta la confirmación.
 * @property {() => void} handleTogglePasswordVisibility - Muestra u oculta la contraseña nueva.
 * @property {boolean} isConfirmationVisible - true si la confirmación se ve como texto.
 * @property {boolean} isPasswordVisible - true si la contraseña nueva se ve como texto.
 * @property {boolean} isSubmitting - Validando o guardando.
 * @property {PasswordResetLinkState} linkState - Resultado de comprobar el enlace.
 * @property {string} newPassword - Valor actual, para el indicador de seguridad.
 * @property {() => void} retryLinkCheck - Vuelve a comprobar el enlace tras un error de red.
 * @property {RefObject<NullableRef<HTMLDivElement>>} serverErrorAlertReference - Recibe el foco al mostrar un error.
 * @property {Nullable<PasswordResetErrorKey>} serverErrorKey - Mensaje del servidor, si hay.
 */
export interface PasswordResetViewModel {
  readonly form: UseFormReturn<PasswordResetFormValues>;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly handleToggleConfirmationVisibility: () => void;
  readonly handleTogglePasswordVisibility: () => void;
  readonly isConfirmationVisible: boolean;
  readonly isPasswordVisible: boolean;
  readonly isSubmitting: boolean;
  readonly linkState: PasswordResetLinkState;
  readonly newPassword: string;
  readonly retryLinkCheck: () => void;
  readonly serverErrorAlertReference: RefObject<NullableRef<HTMLDivElement>>;
  readonly serverErrorKey: Nullable<PasswordResetErrorKey>;
}

/**
 * @typedef {Object} PasswordResetFormProps
 * @property {PasswordResetViewModel} passwordResetViewModel - Estado y acciones del formulario.
 */
export interface PasswordResetFormProps {
  readonly passwordResetViewModel: PasswordResetViewModel;
}

/**
 * @typedef {Object} PasswordResetLinkNoticeProps
 * @property {() => void} onRetry - Reintenta la comprobación cuando falló la red.
 * @property {boolean} shouldOfferRetry - true con error de red; false con enlace inválido.
 */
export interface PasswordResetLinkNoticeProps {
  readonly onRetry: () => void;
  readonly shouldOfferRetry: boolean;
}
