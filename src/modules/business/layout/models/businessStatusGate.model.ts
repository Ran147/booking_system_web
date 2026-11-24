import type { ReactNode } from "react";
import type { BusinessStatus } from "@/domain";
import type { Nullable } from "@/types";
import type { BusinessGateState } from "../constants/BusinessGateState.constants";

/**
 * Campos del negocio que necesita el portero del portal (US-33, D-2).
 * @typedef {Object} BusinessGate
 * @property {string} name - Nombre del negocio.
 * @property {Nullable<string>} rejectionReason - Motivo del rechazo, si lo hay.
 * @property {Nullable<Date>} signedUpAt - Fecha de registro (`createdAt`).
 * @property {BusinessStatus} status - Estado del negocio.
 * @property {Nullable<string>} timeZone - Zona horaria IANA del negocio.
 */
export interface BusinessGate {
  readonly name: string;
  readonly rejectionReason: Nullable<string>;
  readonly signedUpAt: Nullable<Date>;
  readonly status: BusinessStatus;
  readonly timeZone: Nullable<string>;
}

/**
 * Datos de la pantalla "en revisión" (AC-KAN-33-09).
 * @typedef {Object} PendingApprovalDetails
 * @property {string} businessName - Nombre del negocio.
 * @property {Nullable<string>} signedUpAtLabel - Fecha de registro ya formateada.
 */
export interface PendingApprovalDetails {
  readonly businessName: string;
  readonly signedUpAtLabel: Nullable<string>;
}

/**
 * Datos de la pantalla "rechazado" (AC-KAN-33-11).
 * @typedef {Object} RejectionDetails
 * @property {string} businessName - Nombre del negocio.
 * @property {string} contactEmail - Correo de contacto de la plataforma.
 * @property {Nullable<string>} reason - Motivo escrito por el super admin.
 */
export interface RejectionDetails {
  readonly businessName: string;
  readonly contactEmail: string;
  readonly reason: Nullable<string>;
}

/**
 * Salida de `useBusinessStatusGateViewModel`.
 * @typedef {Object} BusinessStatusGateViewModel
 * @property {Nullable<string>} errorMessage - Mensaje traducido si no se pudo leer el negocio.
 * @property {BusinessGateState} gateState - Qué se muestra: carga, error, revisión, rechazo o portal.
 * @property {() => void} handleRetry - Vuelve a leer el negocio.
 * @property {() => void} handleSignOut - Cierra la sesión.
 * @property {boolean} isSigningOut - Si el cierre de sesión está en curso.
 * @property {Nullable<PendingApprovalDetails>} pendingApproval - Datos de "en revisión".
 * @property {Nullable<RejectionDetails>} rejection - Datos de "rechazado".
 */
export interface BusinessStatusGateViewModel {
  readonly errorMessage: Nullable<string>;
  readonly gateState: BusinessGateState;
  readonly handleRetry: () => void;
  readonly handleSignOut: () => void;
  readonly isSigningOut: boolean;
  readonly pendingApproval: Nullable<PendingApprovalDetails>;
  readonly rejection: Nullable<RejectionDetails>;
}

/**
 * Props comunes de las pantallas de estado: solo permiten cerrar sesión.
 * @typedef {Object} BusinessStatusScreenActionProps
 * @property {boolean} isSigningOut - Muestra el botón cargando.
 * @property {() => void} onSignOut - Cierra la sesión.
 */
export interface BusinessStatusScreenActionProps {
  readonly isSigningOut: boolean;
  readonly onSignOut: () => void;
}

/**
 * Marco de página completa de las pantallas de estado.
 * @typedef {Object} BusinessStatusScreenProps
 * @property {ReactNode} children - Detalle del estado.
 * @property {string} description - Texto bajo el título.
 * @property {string} title - Título de la pantalla (h1).
 */
export interface BusinessStatusScreenProps extends BusinessStatusScreenActionProps {
  readonly children: ReactNode;
  readonly description: string;
  readonly title: string;
}

/**
 * @typedef {Object} PendingApprovalScreenProps
 * @property {PendingApprovalDetails} details - Datos del negocio en revisión.
 */
export interface PendingApprovalScreenProps extends BusinessStatusScreenActionProps {
  readonly details: PendingApprovalDetails;
}

/**
 * @typedef {Object} RejectedScreenProps
 * @property {RejectionDetails} details - Datos del negocio rechazado.
 */
export interface RejectedScreenProps extends BusinessStatusScreenActionProps {
  readonly details: RejectionDetails;
}

/**
 * Página completa de error al leer el negocio (AC-KAN-33-12).
 * @typedef {Object} BusinessGateErrorScreenProps
 * @property {string} message - Mensaje traducido.
 * @property {() => void} onRetry - Vuelve a leer el negocio.
 */
export interface BusinessGateErrorScreenProps {
  readonly message: string;
  readonly onRetry: () => void;
}
