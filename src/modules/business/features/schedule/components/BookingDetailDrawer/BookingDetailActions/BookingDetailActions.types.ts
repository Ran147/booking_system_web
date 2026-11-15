/**
 * @file Contratos de tipos para los botones de acción del detalle de reserva.
 */

/**
 * @typedef {Object} BookingDetailActionsProps
 * @property {boolean} canCancel - Indica si la reserva puede cancelarse.
 * @property {boolean} canCompleteOrNoShow - Indica si puede marcarse como completada o no-show.
 * @property {boolean} canConfirm - Indica si puede confirmarse manualmente.
 * @property {boolean} canReschedule - Indica si puede reprogramarse.
 * @property {boolean} isUpdatingStatus - Indica si hay una actualización en curso.
 * @property {() => void} onCancelClick - Callback para abrir el diálogo de cancelación.
 * @property {() => void} onComplete - Callback para marcar la reserva como completada.
 * @property {() => void} onConfirm - Callback para confirmar la reserva.
 * @property {() => void} onMarkNoShow - Callback para marcar la reserva como no-show.
 * @property {() => void} onRescheduleClick - Callback para abrir el diálogo de reprogramación.
 */
export interface BookingDetailActionsProps {
  readonly canCancel: boolean;
  readonly canCompleteOrNoShow: boolean;
  readonly canConfirm: boolean;
  readonly canReschedule: boolean;
  readonly isUpdatingStatus: boolean;
  readonly onCancelClick: () => void;
  readonly onComplete: () => void;
  readonly onConfirm: () => void;
  readonly onMarkNoShow: () => void;
  readonly onRescheduleClick: () => void;
}

