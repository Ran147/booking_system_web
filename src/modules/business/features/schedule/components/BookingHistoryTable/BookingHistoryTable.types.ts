/**
 * @file Contratos de tipos para la tabla de historial de reservas.
 */

import type { Booking } from "@/domain";

/**
 * @typedef {Object} BookingHistoryTableProps
 * @property {readonly Booking[]} bookings - Lista de reservas históricas.
 * @property {boolean} [isLoading] - Indica si la consulta está cargando.
 * @property {(booking: Booking) => void} onSelectBooking - Callback al seleccionar una reserva.
 * @property {string} [timeZone] - Zona horaria IANA del negocio.
 */
export interface BookingHistoryTableProps {
  readonly bookings: readonly Booking[];
  readonly isLoading?: boolean;
  readonly onSelectBooking: (booking: Booking) => void;
  readonly timeZone?: string;
}

