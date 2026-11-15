/**
 * @file Contratos de tipos para el diálogo de creación manual de reservas.
 */

/**
 * @typedef {Object} BookingFormDialogProps
 * @property {boolean} isOpen - Indica si el diálogo está abierto.
 * @property {() => void} onClose - Callback ejecutado al cerrar el diálogo.
 * @property {() => void} [onSuccess] - Callback opcional tras crear la reserva.
 */
export interface BookingFormDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}
