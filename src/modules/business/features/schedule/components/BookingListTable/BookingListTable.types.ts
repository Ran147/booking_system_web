/**
 * @file Contratos de tipos para la tabla de próximas reservas.
 */

import type { Booking } from "@/domain";

/**
 * @typedef {Object} BookingListTableProps
 * @property {readonly Booking[]} bookings - Lista de próximas reservas.
 * @property {boolean} [isLoading] - Indica si la consulta está cargando.
 * @property {() => void} [onNewBooking] - Callback opcional para abrir el modal de nueva reserva.
 * @property {(booking: Booking) => void} onSelectBooking - Callback al seleccionar una reserva.
 * @property {string} [timeZone] - Zona horaria IANA del negocio.
 */
export interface BookingListTableProps {
  readonly bookings: readonly Booking[];
  readonly isLoading?: boolean;
  readonly onNewBooking?: () => void;
  readonly onSelectBooking: (booking: Booking) => void;
  readonly timeZone?: string;
}

