/**
 * @file Contratos de datos de vista para la agenda del negocio.
 */

import type { Tone } from "@/constants";
import type { Booking, BookingStatus } from "@/domain";
import type { Nullable, NullableUndefined } from "@/types";
import type { ScheduleViewMode } from "../constants";
import type { BusinessHours } from "./BusinessHours.model";
import type { ScheduleBlock } from "./ScheduleBlock.model";

/**
 * @typedef {Object} AgendaBlockViewItem
 * @property {ScheduleBlock} block - Bloqueo original del dominio.
 * @property {string} displayReasonOrScope - Motivo del bloqueo o etiqueta de alcance.
 * @property {string} formattedDate - Fecha formateada en la zona horaria del negocio.
 * @property {string} formattedStartTime - Hora de inicio formateada.
 * @property {string} formattedTimeRange - Rango horario o etiqueta de día completo.
 * @property {string} fullDayLabel - Motivo del bloqueo o etiqueta de día completo.
 * @property {string} id - Identificador único del bloqueo.
 * @property {boolean} isFullDay - Indica si bloquea el día completo.
 * @property {boolean} isSelectedDate - Indica si pertenece a la fecha seleccionada.
 * @property {() => void} onDelete - Handler para eliminar este bloqueo.
 * @property {() => void} onFocusDate - Handler para centrar la fecha del bloqueo en la vista actual.
 * @property {() => void} onOpenInDayView - Handler para abrir la fecha del bloqueo en vista diaria.
 * @property {Nullable<string>} reason - Motivo opcional del bloqueo.
 * @property {string} scopeLabel - Etiqueta traducida de alcance (negocio o colaborador).
 */
export interface AgendaBlockViewItem {
  readonly block: ScheduleBlock;
  readonly displayReasonOrScope: string;
  readonly formattedDate: string;
  readonly formattedStartTime: string;
  readonly formattedTimeRange: string;
  readonly fullDayLabel: string;
  readonly id: string;
  readonly isFullDay: boolean;
  readonly isSelectedDate: boolean;
  readonly onDelete: () => void;
  readonly onFocusDate: () => void;
  readonly onOpenInDayView: () => void;
  readonly reason: Nullable<string>;
  readonly scopeLabel: string;
}

/**
 * @typedef {Object} AgendaBookingViewItem
 * @property {Booking} booking - Reserva original del dominio.
 * @property {string} customerId - Identificador o nombre del cliente.
 * @property {number} durationMinutes - Duración del servicio en minutos.
 * @property {string} formattedStartTime - Hora de inicio formateada.
 * @property {string} id - Identificador único de la reserva.
 * @property {() => void} onSelect - Handler para abrir el detalle de la reserva.
 * @property {string} serviceName - Nombre del servicio congelado en el snapshot.
 * @property {BookingStatus} status - Estado actual de la reserva.
 * @property {Tone} statusTone - Tono semántico del badge de estado.
 */
export interface AgendaBookingViewItem {
  readonly booking: Booking;
  readonly customerId: string;
  readonly durationMinutes: number;
  readonly formattedStartTime: string;
  readonly id: string;
  readonly onSelect: () => void;
  readonly serviceName: string;
  readonly status: BookingStatus;
  readonly statusTone: Tone;
}

/**
 * @typedef {Object} AgendaWeekDayViewItem
 * @property {readonly AgendaBookingViewItem[]} bookings - Reservas del día.
 * @property {Date} date - Objeto Date del día.
 * @property {string} dateKey - Clave YYYY-MM-DD en la zona horaria del negocio.
 * @property {string} dayName - Nombre corto localizado del día.
 * @property {string} dayNumber - Número de día del mes.
 * @property {Nullable<AgendaBlockViewItem>} fullDayBlock - Bloqueo de día completo si existe.
 * @property {boolean} isClosed - Indica si el negocio está cerrado ese día.
 * @property {boolean} isEmpty - Indica si no hay reservas ni bloqueos parciales.
 * @property {boolean} isSelected - Indica si coincide con la fecha seleccionada.
 * @property {boolean} isToday - Indica si coincide con el día actual.
 * @property {() => void} onSelect - Handler para abrir el día en vista diaria.
 * @property {readonly AgendaBlockViewItem[]} timedBlocks - Bloqueos parciales del día.
 */
export interface AgendaWeekDayViewItem {
  readonly bookings: readonly AgendaBookingViewItem[];
  readonly date: Date;
  readonly dateKey: string;
  readonly dayName: string;
  readonly dayNumber: string;
  readonly fullDayBlock: Nullable<AgendaBlockViewItem>;
  readonly isClosed: boolean;
  readonly isEmpty: boolean;
  readonly isSelected: boolean;
  readonly isToday: boolean;
  readonly onSelect: () => void;
  readonly timedBlocks: readonly AgendaBlockViewItem[];
}

/**
 * @typedef {Object} AgendaDayViewData
 * @property {readonly AgendaBookingViewItem[]} bookings - Reservas del día seleccionado.
 * @property {readonly AgendaBlockViewItem[]} currentDayBlocks - Todos los bloqueos del día seleccionado.
 * @property {Nullable<AgendaBlockViewItem>} fullDayBlock - Bloqueo de día completo del día seleccionado.
 * @property {boolean} isEmpty - Indica si no hay reservas ni bloqueos parciales en el día.
 * @property {readonly AgendaBlockViewItem[]} timedBlocks - Bloqueos por rango horario del día seleccionado.
 */
export interface AgendaDayViewData {
  readonly bookings: readonly AgendaBookingViewItem[];
  readonly currentDayBlocks: readonly AgendaBlockViewItem[];
  readonly fullDayBlock: Nullable<AgendaBlockViewItem>;
  readonly isEmpty: boolean;
  readonly timedBlocks: readonly AgendaBlockViewItem[];
}

/**
 * @typedef {Object} UseAgendaCalendarViewModelOptions
 * @property {readonly ScheduleBlock[]} blocks - Lista de bloqueos activos.
 * @property {readonly Booking[]} bookings - Lista de reservas.
 * @property {NullableUndefined<BusinessHours>} [businessHours] - Horarios semanales configurados.
 * @property {Date} currentDate - Fecha seleccionada actualmente.
 * @property {(date: Date) => void} onDateChange - Callback al cambiar la fecha.
 * @property {(block: ScheduleBlock) => void} [onDeleteBlock] - Callback opcional al eliminar un bloqueo.
 * @property {(booking: Booking) => void} onSelectBooking - Callback al seleccionar una reserva.
 * @property {(mode: ScheduleViewMode) => void} onViewModeChange - Callback al cambiar modo día/semana.
 * @property {string} [timeZone] - Zona horaria IANA del negocio.
 * @property {ScheduleViewMode} viewMode - Modo de visualización activo.
 */
export interface UseAgendaCalendarViewModelOptions {
  readonly blocks: readonly ScheduleBlock[];
  readonly bookings: readonly Booking[];
  readonly businessHours?: NullableUndefined<BusinessHours>;
  readonly currentDate: Date;
  readonly onDateChange: (date: Date) => void;
  readonly onDeleteBlock?: (block: ScheduleBlock) => void;
  readonly onSelectBooking: (booking: Booking) => void;
  readonly onViewModeChange: (mode: ScheduleViewMode) => void;
  readonly timeZone?: string;
  readonly viewMode: ScheduleViewMode;
}

/**
 * @typedef {Object} UseAgendaCalendarViewModelResult
 * @property {readonly AgendaBlockViewItem[]} allBlocks - Todos los bloqueos ordenados cronológicamente.
 * @property {AgendaDayViewData} dayView - Datos preparados para la vista diaria.
 * @property {string} formattedHeaderTitle - Título formateado para día o rango semanal.
 * @property {() => void} handleNext - Avanza un día o una semana.
 * @property {() => void} handlePrevious - Retrocede un día o una semana.
 * @property {() => void} handleSwitchToDayView - Cambia a vista diaria.
 * @property {() => void} handleSwitchToWeekView - Cambia a vista semanal.
 * @property {() => void} handleToday - Navega a la fecha actual.
 * @property {boolean} hasConfiguredHours - Indica si hay horarios configurados.
 * @property {boolean} hasDeleteBlockAction - Indica si el usuario puede eliminar bloqueos.
 * @property {boolean} isDayView - Indica si el modo activo es diario.
 * @property {boolean} isWeekView - Indica si el modo activo es semanal.
 * @property {string} timeZone - Zona horaria efectiva del negocio.
 * @property {readonly AgendaWeekDayViewItem[]} weekDays - Días preparados para la vista semanal.
 */
export interface UseAgendaCalendarViewModelResult {
  readonly allBlocks: readonly AgendaBlockViewItem[];
  readonly dayView: AgendaDayViewData;
  readonly formattedHeaderTitle: string;
  readonly handleNext: () => void;
  readonly handlePrevious: () => void;
  readonly handleSwitchToDayView: () => void;
  readonly handleSwitchToWeekView: () => void;
  readonly handleToday: () => void;
  readonly hasConfiguredHours: boolean;
  readonly hasDeleteBlockAction: boolean;
  readonly isDayView: boolean;
  readonly isWeekView: boolean;
  readonly timeZone: string;
  readonly weekDays: readonly AgendaWeekDayViewItem[];
}
