/**
 * @file Contratos de tipos para el diálogo de cancelación de reservas.
 */

import type { Booking } from "@/domain";
import type { Nullable } from "@/types";

/**
 * @typedef {Object} CancelBookingDialogProps
 * @property {Nullable<Booking>} booking - Reserva seleccionada para cancelar.
 * @property {boolean} isOpen - Indica si el diálogo está visible.
 * @property {() => void} onClose - Callback al cerrar el diálogo.
 * @property {() => void} [onSuccess] - Callback opcional al completar la cancelación.
 */
export interface CancelBookingDialogProps {
  readonly booking: Nullable<Booking>;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}
