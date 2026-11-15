/**
 * @file Contratos de tipos para el diálogo de reprogramación de reservas.
 */

import type { Booking } from "@/domain";
import type { Nullable } from "@/types";

/**
 * @typedef {Object} RescheduleBookingDialogProps
 * @property {Nullable<Booking>} booking - Reserva seleccionada para reprogramar.
 * @property {boolean} isOpen - Indica si el diálogo está abierto.
 * @property {() => void} onClose - Callback al cerrar el diálogo.
 * @property {() => void} [onSuccess] - Callback opcional al reprogramar con éxito.
 */
export interface RescheduleBookingDialogProps {
  readonly booking: Nullable<Booking>;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

