/**
 * @file Contratos de tipos para la vista principal de calendario de la agenda.
 */

import type { Booking } from "@/domain";
import type {
  BusinessHours,
  ScheduleBlock,
  ScheduleViewMode,
} from "@/modules/business/features/schedule";
import type { NullableUndefined } from "@/types";

/**
 * @typedef {Object} AgendaCalendarViewProps
 * @property {readonly ScheduleBlock[]} blocks - Bloqueos de agenda del negocio.
 * @property {readonly Booking[]} bookings - Reservas del negocio.
 * @property {NullableUndefined<BusinessHours>} [businessHours] - Horarios semanales configurados.
 * @property {Date} currentDate - Fecha activa en el calendario.
 * @property {(date: Date) => void} onDateChange - Callback al cambiar la fecha seleccionada.
 * @property {(block: ScheduleBlock) => void} [onDeleteBlock] - Callback opcional al eliminar un bloqueo.
 * @property {(booking: Booking) => void} onSelectBooking - Callback al seleccionar una reserva.
 * @property {(mode: ScheduleViewMode) => void} onViewModeChange - Callback al cambiar entre vista diaria y semanal.
 * @property {string} [timeZone] - Zona horaria IANA del negocio.
 * @property {ScheduleViewMode} viewMode - Modo de visualización activo.
 */
export interface AgendaCalendarViewProps {
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

