import type { BaseSyntheticEvent, RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { UserRole } from "@/domain";
import type { Nullable, NullableRef } from "@/types";
import type { SignInFormValues } from "./SignInForm.schema";
import type { SignInErrorKey } from "../constants/SignInErrorKey.constants";

/**
 * @file Contratos de la pantalla de inicio de sesión (US-33).
 */

/**
 * @typedef {(role: UserRole) => string} ResolveSignInDestination
 * Devuelve el redirectTo seguro o, si no hay, el inicio del portal del rol.
 */
export type ResolveSignInDestination = (role: UserRole) => string;

/**
 * @typedef {Object} RoleGateTargets
 * @property {string} ownPortalPath - Inicio del portal del rol con sesión.
 * @property {string} signInPath - Login con la ruta actual como redirectTo.
 */
export interface RoleGateTargets {
  readonly ownPortalPath: string;
  readonly signInPath: string;
}

/**
 * @typedef {Object} SignInViewModel
 * @property {UseFormReturn<SignInFormValues>} form - Estado del formulario.
 * @property {(event?: BaseSyntheticEvent) => Promise<void>} handleSubmit - Valida y envía.
 * @property {(recaptchaToken: Nullable<string>) => void} handleRecaptchaTokenChange - Guarda el token del widget.
 * @property {() => void} handleTogglePasswordVisibility - Muestra u oculta la contraseña.
 * @property {boolean} isPasswordVisible - true si la contraseña se ve como texto.
 * @property {boolean} isSubmitDisabled - Sin token de reCAPTCHA o con una petición en curso.
 * @property {boolean} isSubmitting - Validando o enviando.
 * @property {string} language - Idioma activo para el widget de reCAPTCHA.
 * @property {number} recaptchaResetSignal - Cambia para reiniciar el widget.
 * @property {string} recaptchaSiteKey - Clave pública del sitio.
 * @property {RefObject<NullableRef<HTMLDivElement>>} serverErrorAlertReference - Recibe el foco al mostrar un error.
 * @property {Nullable<SignInErrorKey>} serverErrorKey - Mensaje del servidor, si hay.
 * @property {boolean} shouldShowPasswordRecoveryLink - Solo con demasiados intentos.
 */
export interface SignInViewModel {
  readonly form: UseFormReturn<SignInFormValues>;
  readonly handleRecaptchaTokenChange: (
    recaptchaToken: Nullable<string>,
  ) => void;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly handleTogglePasswordVisibility: () => void;
  readonly isPasswordVisible: boolean;
  readonly isSubmitDisabled: boolean;
  readonly isSubmitting: boolean;
  readonly language: string;
  readonly recaptchaResetSignal: number;
  readonly recaptchaSiteKey: string;
  readonly serverErrorAlertReference: RefObject<NullableRef<HTMLDivElement>>;
  readonly serverErrorKey: Nullable<SignInErrorKey>;
  readonly shouldShowPasswordRecoveryLink: boolean;
}

/**
 * @typedef {Object} SignInFormProps
 * @property {SignInViewModel} signInViewModel - Estado y acciones del formulario.
 */
export interface SignInFormProps {
  readonly signInViewModel: SignInViewModel;
}

/**
 * @typedef {Object} SignInErrorAlertProps
 * @property {RefObject<NullableRef<HTMLDivElement>>} alertReference - Para mover el foco al mensaje.
 * @property {Nullable<SignInErrorKey>} errorKey - Mensaje a mostrar; null no pinta nada.
 * @property {boolean} shouldShowPasswordRecoveryLink - Agrega el enlace a recuperar la contraseña.
 */
export interface SignInErrorAlertProps {
  readonly alertReference: RefObject<NullableRef<HTMLDivElement>>;
  readonly errorKey: Nullable<SignInErrorKey>;
  readonly shouldShowPasswordRecoveryLink: boolean;
}
