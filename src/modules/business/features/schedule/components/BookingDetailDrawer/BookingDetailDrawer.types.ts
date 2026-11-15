/**
 * @file Contratos de tipos para el modal de detalle de reserva.
 */

import type { Booking } from "@/domain";
import type { Nullable } from "@/types";

/**
 * @typedef {Object} BookingDetailDrawerProps
 * @property {Nullable<Booking>} booking - Reserva seleccionada para visualizar.
 * @property {boolean} [hasStarted] - Indica si la hora de inicio ya transcurrió.
 * @property {boolean} isOpen - Indica si el modal está abierto.
 * @property {() => void} onCancelClick - Callback al pulsar cancelar reserva.
 * @property {() => void} onClose - Callback al cerrar el detalle.
 * @property {() => void} onRescheduleClick - Callback al pulsar reprogramar.
 * @property {() => void} [onSuccess] - Callback opcional tras actualizar el estado.
 * @property {string} [timeZone] - Zona horaria IANA del negocio.
 */
export interface BookingDetailDrawerProps {
  readonly booking: Nullable<Booking>;
  readonly hasStarted?: boolean;
  readonly isOpen: boolean;
  readonly onCancelClick: () => void;
  readonly onClose: () => void;
  readonly onRescheduleClick: () => void;
  readonly onSuccess?: () => void;
  readonly timeZone?: string;
}

