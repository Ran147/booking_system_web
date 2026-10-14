import type { NullableRef } from "@/types";
import type {
  IdleMessageType,
  SignOutReason,
} from "../constants/IdleSession.constants";

/**
 * @file Contratos del cierre de sesión por inactividad (US-38, KAN-133).
 */

/**
 * @typedef {Object} SignOutOptions
 * @property {string} [redirectPath] - Página a la que volver tras iniciar sesión (redirectTo).
 * @property {SignOutReason} [reason] - Por qué se cierra; sign-in lo muestra.
 */
export interface SignOutOptions {
  readonly reason?: SignOutReason;
  readonly redirectPath?: string;
}

/**
 * @typedef {Object} IdleMessage
 * @property {IdleMessageType} type - activity o signed-out.
 * @property {number} [activityAt] - Marca de tiempo de la actividad (solo en activity).
 */
export interface IdleMessage {
  readonly activityAt?: number;
  readonly type: IdleMessageType;
}

/**
 * @typedef {Object} UseIdleSessionParameters
 * @property {number} idleTimeoutMinutes - Minutos sin actividad hasta cerrar la sesión.
 * @property {(activityAt: number) => void} onLocalActivity - Avisa a las otras pestañas.
 * @property {() => void} onExpire - Se llama una vez al llegar al límite.
 */
export interface UseIdleSessionParameters {
  readonly idleTimeoutMinutes: number;
  readonly onExpire: () => void;
  readonly onLocalActivity: (activityAt: number) => void;
}

/**
 * @typedef {Object} IdleSession
 * @property {(activityAt?: number) => void} registerActivity - Cuenta como actividad (propia, "seguir conectado" o de otra pestaña).
 * @property {NullableRef<number>} remainingWarningSeconds - Segundos del aviso; null mientras no se muestra.
 */
export interface IdleSession {
  readonly registerActivity: (activityAt?: number) => void;
  readonly remainingWarningSeconds: NullableRef<number>;
}

/**
 * @typedef {Object} IdleTabSync
 * @property {(activityAt: number) => void} broadcastActivity - Comparte la actividad (limitado a una vez cada 5 s).
 * @property {() => void} broadcastSignedOut - Avisa que esta pestaña cerró la sesión.
 */
export interface IdleTabSync {
  readonly broadcastActivity: (activityAt: number) => void;
  readonly broadcastSignedOut: () => void;
}

/**
 * @typedef {Object} IdleWarningDialogProps
 * @property {() => void} onSignOut - Cierra la sesión ahora.
 * @property {() => void} onStayConnected - Reinicia la cuenta de inactividad.
 * @property {number} remainingSeconds - Segundos que faltan para cerrar.
 */
export interface IdleWarningDialogProps {
  readonly onSignOut: () => void;
  readonly onStayConnected: () => void;
  readonly remainingSeconds: number;
}
