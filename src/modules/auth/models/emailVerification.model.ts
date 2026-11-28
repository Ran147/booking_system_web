import type { Nullable } from "@/types";
import type {
  EmailVerificationErrorKey,
  EmailVerificationState,
} from "../constants/AuthAction.constants";

/**
 * @file Contratos de la página que abre el enlace de verificación de correo (KAN-126).
 */

/**
 * @typedef {Object} EmailVerificationError
 * @property {string} code - Código de Firebase, o "unknown".
 * @property {EmailVerificationErrorKey} messageKey - Mensaje que se muestra.
 */
export interface EmailVerificationError {
  readonly code: string;
  readonly messageKey: EmailVerificationErrorKey;
}

/**
 * @typedef {Object} EmailVerificationViewModel
 * @property {Nullable<EmailVerificationErrorKey>} errorKey - Mensaje del error que se puede reintentar (red o desconocido); null en los demás estados.
 * @property {() => void} retryVerification - Vuelve a aplicar el código tras un error que se puede reintentar.
 * @property {string} signInPath - Inicio de sesión al que lleva el botón; usa la ruta segura de continueUrl si la hay.
 * @property {EmailVerificationState} verificationState - Resultado de aplicar el código.
 */
export interface EmailVerificationViewModel {
  readonly errorKey: Nullable<EmailVerificationErrorKey>;
  readonly retryVerification: () => void;
  readonly signInPath: string;
  readonly verificationState: EmailVerificationState;
}

/**
 * @typedef {Object} EmailVerificationNoticeProps
 * @property {EmailVerificationViewModel} emailVerificationViewModel - Estado y acciones de la verificación.
 */
export interface EmailVerificationNoticeProps {
  readonly emailVerificationViewModel: EmailVerificationViewModel;
}
