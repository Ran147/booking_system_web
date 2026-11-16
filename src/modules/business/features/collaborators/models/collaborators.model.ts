import type { BaseSyntheticEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ViewState } from "@/constants";
import type { CollaboratorPermission, CollaboratorStatus } from "@/domain";
import type { Nullable, PageCursor } from "@/types";
import type { CollaboratorFormValues } from "./CollaboratorForm.schema";
import type { CollaboratorStatusDialogMode } from "../constants/CollaboratorFeature.constants";

/**
 * @file Contratos e interfaces del modulo de gestion de colaboradores (KAN-77).
 */

/**
 * @typedef {Object} CollaboratorListFilters
 * @property {string} searchTerm - Termino de busqueda por nombre o correo.
 * @property {CollaboratorStatus | ""} status - Filtro por estado de colaborador.
 */
export interface CollaboratorListFilters {
  readonly searchTerm: string;
  readonly status: CollaboratorStatus | "";
}

/**
 * @typedef {Object} CollaboratorListItem
 * @property {string} email - Correo del colaborador.
 * @property {string} fullName - Nombre completo del colaborador.
 * @property {string} id - Identificador del documento de colaborador.
 * @property {Nullable<string>} lastEmailSentAt - Fecha ISO del ultimo envio de correo.
 * @property {readonly CollaboratorPermission[]} permissions - Permisos habilitados.
 * @property {string} phone - Telefono de contacto.
 * @property {readonly string[]} serviceIds - Identificadores de servicios asignados.
 * @property {Nullable<string>} specialty - Especialidad opcional.
 * @property {CollaboratorStatus} status - Estado actual en la maquina de estados.
 */
export interface CollaboratorListItem {
  readonly email: string;
  readonly fullName: string;
  readonly id: string;
  readonly lastEmailSentAt: Nullable<string>;
  readonly permissions: readonly CollaboratorPermission[];
  readonly phone: string;
  readonly serviceIds: readonly string[];
  readonly specialty: Nullable<string>;
  readonly status: CollaboratorStatus;
}

/**
 * @typedef {Object} ActiveServiceOption
 * @property {string} id - Identificador del servicio activo.
 * @property {string} name - Nombre visible del servicio.
 */
export interface ActiveServiceOption {
  readonly id: string;
  readonly name: string;
}

/**
 * @typedef {Object} CollaboratorDetailData
 * @property {string} businessId - Identificador del negocio propietario.
 * @property {string} email - Correo del colaborador.
 * @property {string} fullName - Nombre completo del colaborador.
 * @property {string} id - Identificador del colaborador.
 * @property {Nullable<string>} lastEmailSentAt - Fecha ISO del ultimo envio de correo.
 * @property {readonly CollaboratorPermission[]} permissions - Permisos habilitados.
 * @property {string} phone - Telefono del colaborador.
 * @property {readonly ActiveServiceOption[]} services - Servicios asignados con su nombre.
 * @property {readonly string[]} serviceIds - Identificadores de servicios asignados.
 * @property {Nullable<string>} specialty - Especialidad opcional.
 * @property {CollaboratorStatus} status - Estado actual.
 * @property {number} upcomingBookingsCount - Cantidad de reservas futuras activas.
 * @property {Readonly<Record<string, number>>} upcomingBookingsByService - Conteo de reservas futuras por servicio.
 * @property {readonly string[]} upcomingServiceIdsWithBookings - Servicios con reservas futuras activas.
 * @property {string} updatedAt - Marca temporal ISO para concurrencia optimista.
 * @property {Nullable<string>} userId - UID en Auth si ya acepto la invitacion.
 */
export interface CollaboratorDetailData {
  readonly businessId: string;
  readonly email: string;
  readonly fullName: string;
  readonly id: string;
  readonly lastEmailSentAt: Nullable<string>;
  readonly permissions: readonly CollaboratorPermission[];
  readonly phone: string;
  readonly serviceIds: readonly string[];
  readonly services: readonly ActiveServiceOption[];
  readonly specialty: Nullable<string>;
  readonly status: CollaboratorStatus;
  readonly upcomingBookingsByService: Readonly<Record<string, number>>;
  readonly upcomingBookingsCount: number;
  readonly upcomingServiceIdsWithBookings: readonly string[];
  readonly updatedAt: string;
  readonly userId: Nullable<string>;
}

/**
 * @typedef {Object} CollaboratorUsageSummary
 * @property {boolean} hasHigherPlan - Indica si existe un plan activo con limite mayor.
 * @property {boolean} isReadOnly - Indica si el negocio esta en modo de solo lectura.
 * @property {Nullable<number>} limit - Maximo de colaboradores del plan actual.
 * @property {number} used - Cantidad de colaboradores invited y active.
 */
export interface CollaboratorUsageSummary {
  readonly hasHigherPlan: boolean;
  readonly isReadOnly: boolean;
  readonly limit: Nullable<number>;
  readonly used: number;
}

/**
 * @typedef {Object} CollaboratorListQueryParams
 * @property {string} businessId - Identificador del negocio.
 * @property {CollaboratorListFilters} filters - Filtros activos.
 * @property {Nullable<PageCursor>} pageCursor - Cursor de paginacion.
 * @property {number} pageSize - Tamano de pagina.
 */
export interface CollaboratorListQueryParams {
  readonly businessId: string;
  readonly filters: CollaboratorListFilters;
  readonly pageCursor: Nullable<PageCursor>;
  readonly pageSize: number;
}

/**
 * @typedef {Object} CollaboratorLimitDialogState
 * @property {boolean} hasHigherPlan - Hay planes superiores disponibles para mejorar.
 * @property {boolean} isOpen - Visibilidad del dialogo de limite alcanzado.
 * @property {Nullable<number>} limit - Limite maximo de colaboradores del plan actual.
 */
export interface CollaboratorLimitDialogState {
  readonly hasHigherPlan: boolean;
  readonly isOpen: boolean;
  readonly limit: Nullable<number>;
}

/**
 * @typedef {Object} CollaboratorStatusDialogState
 * @property {Nullable<CollaboratorListItem>} collaborator - Colaborador objetivo.
 * @property {Nullable<CollaboratorStatusDialogMode>} mode - Accion a confirmar.
 * @property {number} upcomingBookingsCount - Reservas futuras activas al desactivar.
 */
export interface CollaboratorStatusDialogState {
  readonly collaborator: Nullable<CollaboratorListItem>;
  readonly mode: Nullable<CollaboratorStatusDialogMode>;
  readonly upcomingBookingsCount: number;
}

/**
 * @typedef {Object} CollaboratorListViewModel
 * @property {CollaboratorListFilters} filters - Filtros activos sincronizados con URL.
 * @property {() => void} handleClearFilters - Limpia busqueda y filtro de estado.
 * @property {() => void} handleCloseLimitDialog - Cierra el dialogo de limite de plan.
 * @property {() => void} handleCloseStatusDialog - Cierra el dialogo de estado.
 * @property {() => Promise<void>} handleConfirmStatusChange - Ejecuta desactivar o reactivar.
 * @property {(collaboratorId: string) => void} handleNavigateToDetail - Abre la ficha.
 * @property {(collaboratorId: string) => void} handleNavigateToEdit - Abre edicion.
 * @property {() => void} handleNavigateToNew - Abre alta o muestra limite alcanzado.
 * @property {(collaboratorId: string) => void} handleNavigateToPermissions - Abre permisos.
 * @property {() => void} handleNavigateToUpgrade - Navega al catalogo de planes.
 * @property {() => void} handleNextPageClick - Avanza a la pagina siguiente.
 * @property {(collaborator: CollaboratorListItem) => void} handleOpenDeactivateDialog - Abre confirmacion de desactivar.
 * @property {(collaborator: CollaboratorListItem) => void} handleOpenReactivateDialog - Abre confirmacion de reactivar.
 * @property {() => void} handlePreviousPageClick - Retrocede a la pagina anterior.
 * @property {(collaborator: CollaboratorListItem) => Promise<void>} handleResendEmail - Reenvia invitacion o restablecimiento.
 * @property {() => void} handleRetry - Reintenta carga tras error.
 * @property {(searchTerm: string) => void} handleSearchChange - Actualiza busqueda.
 * @property {(status: CollaboratorStatus | "") => void} handleStatusFilterChange - Actualiza filtro de estado.
 * @property {boolean} hasActiveFilters - Indica si hay filtros aplicados.
 * @property {boolean} hasNextPage - Hay pagina siguiente.
 * @property {boolean} hasPreviousPage - Hay pagina anterior.
 * @property {boolean} isLimitReached - Indica si alcanzo maxCollaborators.
 * @property {boolean} isMutatingStatus - Mutacion de estado en curso.
 * @property {boolean} isReadOnly - Negocio en modo solo lectura.
 * @property {Nullable<string>} isResendingCollaboratorId - ID del colaborador cuyo envio esta en curso.
 * @property {readonly CollaboratorListItem[]} items - Colaboradores de la pagina actual.
 * @property {CollaboratorLimitDialogState} limitDialog - Estado del modal de limite.
 * @property {number} pageNumber - Numero de pagina actual.
 * @property {Record<string, string>} serviceNamesById - Mapa de nombres de servicios activos.
 * @property {CollaboratorStatusDialogState} statusDialog - Estado del modal de desactivar/reactivar.
 * @property {number} totalCount - Total de resultados filtrados.
 * @property {Nullable<CollaboratorUsageSummary>} usage - Resumen de uso vs limite del plan.
 * @property {ViewState} viewState - Estado de carga/datos/vacio/error.
 */
export interface CollaboratorListViewModel {
  readonly filters: CollaboratorListFilters;
  readonly handleClearFilters: () => void;
  readonly handleCloseLimitDialog: () => void;
  readonly handleCloseStatusDialog: () => void;
  readonly handleConfirmStatusChange: () => Promise<void>;
  readonly handleNavigateToDetail: (collaboratorId: string) => void;
  readonly handleNavigateToEdit: (collaboratorId: string) => void;
  readonly handleNavigateToNew: () => void;
  readonly handleNavigateToPermissions: (collaboratorId: string) => void;
  readonly handleNavigateToUpgrade: () => void;
  readonly handleNextPageClick: () => void;
  readonly handleOpenDeactivateDialog: (
    collaborator: CollaboratorListItem,
  ) => void;
  readonly handleOpenReactivateDialog: (
    collaborator: CollaboratorListItem,
  ) => void;
  readonly handlePreviousPageClick: () => void;
  readonly handleResendEmail: (
    collaborator: CollaboratorListItem,
  ) => Promise<void>;
  readonly handleRetry: () => void;
  readonly handleSearchChange: (searchTerm: string) => void;
  readonly handleStatusFilterChange: (status: CollaboratorStatus | "") => void;
  readonly hasActiveFilters: boolean;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly isLimitReached: boolean;
  readonly isMutatingStatus: boolean;
  readonly isReadOnly: boolean;
  readonly isResendingCollaboratorId: Nullable<string>;
  readonly items: readonly CollaboratorListItem[];
  readonly limitDialog: CollaboratorLimitDialogState;
  readonly pageNumber: number;
  readonly serviceNamesById: Readonly<Record<string, string>>;
  readonly statusDialog: CollaboratorStatusDialogState;
  readonly totalCount: number;
  readonly usage: Nullable<CollaboratorUsageSummary>;
  readonly viewState: ViewState;
}

/**
 * @typedef {Object} CollaboratorFormViewModel
 * @property {readonly ActiveServiceOption[]} activeServices - Servicios activos seleccionables.
 * @property {UseFormReturn<CollaboratorFormValues>} form - Formulario React Hook Form.
 * @property {() => void} handleCancel - Regresa al listado o detalle.
 * @property {() => void} handleCloseLimitDialog - Cierra el dialogo de limite de plan.
 * @property {() => void} handleNavigateToServices - Navega a servicios cuando no hay activos.
 * @property {() => void} handleNavigateToUpgrade - Navega al catalogo de planes.
 * @property {(permission: CollaboratorPermission) => void} handleTogglePermission - Alterna permiso inicial.
 * @property {(serviceId: string) => void} handleToggleService - Alterna servicio asignado.
 * @property {(event?: BaseSyntheticEvent) => Promise<void>} handleSubmit - Valida y guarda.
 * @property {boolean} hasNoActiveServices - True en alta si no hay servicios activos.
 * @property {boolean} isEmailLocked - Bloquea el correo cuando el colaborador no esta invited.
 * @property {boolean} isEditMode - True si edita colaborador existente.
 * @property {boolean} isLoading - Cargando datos iniciales.
 * @property {boolean} isReadOnly - Negocio en modo solo lectura.
 * @property {boolean} isSubmitting - Envio en curso.
 * @property {CollaboratorLimitDialogState} limitDialog - Dialogo de limite alcanzado.
 * @property {Nullable<string>} loadError - Error al cargar edicion.
 * @property {number} removedServicesBookingsCount - Reservas futuras afectadas al quitar servicios.
 * @property {readonly CollaboratorPermission[]} selectedPermissions - Permisos seleccionados.
 * @property {readonly string[]} selectedServiceIds - Servicios seleccionados.
 * @property {Nullable<string>} serverErrorKey - Error de servidor mostrado en formulario.
 */
export interface CollaboratorFormViewModel {
  readonly activeServices: readonly ActiveServiceOption[];
  readonly form: UseFormReturn<CollaboratorFormValues>;
  readonly handleCancel: () => void;
  readonly handleCloseLimitDialog: () => void;
  readonly handleNavigateToServices: () => void;
  readonly handleNavigateToUpgrade: () => void;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly handleTogglePermission: (permission: CollaboratorPermission) => void;
  readonly handleToggleService: (serviceId: string) => void;
  readonly hasNoActiveServices: boolean;
  readonly isEditMode: boolean;
  readonly isEmailLocked: boolean;
  readonly isLoading: boolean;
  readonly isReadOnly: boolean;
  readonly isSubmitting: boolean;
  readonly limitDialog: CollaboratorLimitDialogState;
  readonly loadError: Nullable<string>;
  readonly removedServicesBookingsCount: number;
  readonly selectedPermissions: readonly CollaboratorPermission[];
  readonly selectedServiceIds: readonly string[];
  readonly serverErrorKey: Nullable<string>;
}

/**
 * @typedef {Object} CollaboratorProfileViewModel
 * @property {Nullable<CollaboratorDetailData>} collaborator - Detalle cargado del colaborador.
 * @property {number} cooldownSecondsRemaining - Segundos restantes para poder reenviar correo.
 * @property {() => void} handleBackToList - Regresa al listado de colaboradores.
 * @property {() => void} handleCloseLimitDialog - Cierra el dialogo de limite de plan.
 * @property {() => void} handleCloseStatusDialog - Cierra confirmacion de estado.
 * @property {() => Promise<void>} handleConfirmStatusChange - Ejecuta desactivar o reactivar.
 * @property {() => void} handleNavigateToEdit - Abre formulario de edicion.
 * @property {() => void} handleNavigateToPermissions - Abre formulario de permisos.
 * @property {() => void} handleNavigateToUpgrade - Navega al catalogo de planes.
 * @property {() => void} handleOpenDeactivateDialog - Abre dialogo de desactivar.
 * @property {() => void} handleOpenReactivateDialog - Abre dialogo de reactivar.
 * @property {() => Promise<void>} handleResendEmail - Reenvia invitacion o restablecimiento.
 * @property {() => void} handleRetry - Reintenta carga del detalle.
 * @property {boolean} isLoading - Cargando detalle.
 * @property {boolean} isMutatingStatus - Mutacion de estado en curso.
 * @property {boolean} isNotFound - El colaborador no existe.
 * @property {boolean} isReadOnly - Negocio en modo solo lectura.
 * @property {boolean} isResendingEmail - Reenvio en curso.
 * @property {CollaboratorLimitDialogState} limitDialog - Dialogo de limite de plan.
 * @property {Nullable<string>} loadError - Error de lectura.
 * @property {Nullable<"deactivate" | "reactivate">} statusDialogMode - Modal abierto para cambio de estado.
 */
export interface CollaboratorProfileViewModel {
  readonly collaborator: Nullable<CollaboratorDetailData>;
  readonly cooldownSecondsRemaining: number;
  readonly handleBackToList: () => void;
  readonly handleCloseLimitDialog: () => void;
  readonly handleCloseStatusDialog: () => void;
  readonly handleConfirmStatusChange: () => Promise<void>;
  readonly handleNavigateToEdit: () => void;
  readonly handleNavigateToPermissions: () => void;
  readonly handleNavigateToUpgrade: () => void;
  readonly handleOpenDeactivateDialog: () => void;
  readonly handleOpenReactivateDialog: () => void;
  readonly handleResendEmail: () => Promise<void>;
  readonly handleRetry: () => void;
  readonly isLoading: boolean;
  readonly isMutatingStatus: boolean;
  readonly isNotFound: boolean;
  readonly isReadOnly: boolean;
  readonly isResendingEmail: boolean;
  readonly limitDialog: CollaboratorLimitDialogState;
  readonly loadError: Nullable<string>;
  readonly statusDialogMode: Nullable<CollaboratorStatusDialogMode>;
}

/**
 * @typedef {Object} CollaboratorPermissionsViewModel
 * @property {Nullable<CollaboratorDetailData>} collaborator - Colaborador objetivo.
 * @property {() => void} handleCancel - Regresa al detalle del colaborador.
 * @property {() => void} handleRetry - Reintenta carga.
 * @property {() => Promise<void>} handleSave - Guarda los permisos seleccionados.
 * @property {(permission: CollaboratorPermission) => void} handleTogglePermission - Alterna permiso.
 * @property {boolean} isLoading - Cargando datos.
 * @property {boolean} isNotFound - Colaborador inexistente.
 * @property {boolean} isReadOnly - Negocio en modo solo lectura.
 * @property {boolean} isSaving - Guardado en curso.
 * @property {Nullable<string>} loadError - Error de lectura.
 * @property {readonly CollaboratorPermission[]} selectedPermissions - Permisos seleccionados actualmente.
 */
export interface CollaboratorPermissionsViewModel {
  readonly collaborator: Nullable<CollaboratorDetailData>;
  readonly handleCancel: () => void;
  readonly handleRetry: () => void;
  readonly handleSave: () => Promise<void>;
  readonly handleTogglePermission: (permission: CollaboratorPermission) => void;
  readonly isLoading: boolean;
  readonly isNotFound: boolean;
  readonly isReadOnly: boolean;
  readonly isSaving: boolean;
  readonly loadError: Nullable<string>;
  readonly selectedPermissions: readonly CollaboratorPermission[];
}
