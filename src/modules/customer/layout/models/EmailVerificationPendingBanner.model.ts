import type { AlertVariant } from "@/components/common";
import type { Nullable } from "@/types";

/**
 * @typedef {Object} ResendVerificationEmailVariables
 * @property {string} continueUrl - Página del negocio a la que vuelve el enlace del correo.
 * @property {string} language - Idioma del correo (es | en).
 */
export interface ResendVerificationEmailVariables {
  readonly continueUrl: string;
  readonly language: string;
}

/**
 * @typedef {Object} ResendVerificationFeedback
 * @property {string} message - Resultado del reenvío ya traducido.
 * @property {AlertVariant} variant - success al enviarse; warning o destructive si falla.
 */
export interface ResendVerificationFeedback {
  readonly message: string;
  readonly variant: AlertVariant;
}

/**
 * Aviso "verifica tu correo" del portal del cliente (KAN-126).
 * @typedef {Object} EmailVerificationPendingBannerViewModel
 * @property {() => void} handleResend - Pide otro correo de verificación.
 * @property {boolean} isResending - true mientras Firebase responde.
 * @property {boolean} isVisible - Sesión de cliente con el correo sin verificar.
 * @property {Nullable<ResendVerificationFeedback>} resendFeedback - Resultado del último reenvío.
 */
export interface EmailVerificationPendingBannerViewModel {
  readonly handleResend: () => void;
  readonly isResending: boolean;
  readonly isVisible: boolean;
  readonly resendFeedback: Nullable<ResendVerificationFeedback>;
}
