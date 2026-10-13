import type { Nullable } from "@/types";

/**
 * @typedef {Object} RecaptchaFieldProps
 * @property {string} label - Nombre accesible traducido del bloque.
 * @property {string} language - Idioma del widget (es, en).
 * @property {(recaptchaToken: Nullable<string>) => void} onTokenChange - Recibe el token al resolverlo y null cuando expira o falla.
 * @property {number} resetSignal - Cada cambio reinicia el widget (token rechazado o usado).
 * @property {string} siteKey - Clave pública del sitio.
 */
export interface RecaptchaFieldProps {
  readonly label: string;
  readonly language: string;
  readonly onTokenChange: (recaptchaToken: Nullable<string>) => void;
  readonly resetSignal: number;
  readonly siteKey: string;
}

/**
 * Parámetros de grecaptcha.render (API de Google, reCAPTCHA v2).
 */
export interface RecaptchaRenderParameters {
  readonly callback: (recaptchaToken: string) => void;
  readonly "error-callback": () => void;
  readonly "expired-callback": () => void;
  readonly sitekey: string;
}

/**
 * Parte de window.grecaptcha que usa el widget.
 */
export interface RecaptchaApi {
  readonly render: (
    container: HTMLElement,
    renderParameters: RecaptchaRenderParameters,
  ) => number;
  readonly reset: (widgetId: number) => void;
}

/**
 * @typedef {Object} UseRecaptchaWidgetOptions
 * Las mismas propiedades de RecaptchaFieldProps, salvo label.
 */
export type UseRecaptchaWidgetOptions = Omit<RecaptchaFieldProps, "label">;

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
    onRecaptchaLoad?: () => void;
  }
}
