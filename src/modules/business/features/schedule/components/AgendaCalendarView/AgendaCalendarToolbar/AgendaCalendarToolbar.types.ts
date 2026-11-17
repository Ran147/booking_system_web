/**
 * @file Contratos de tipos para la barra de navegación y cambio de vista de la agenda.
 */

/**
 * @typedef {Object} AgendaCalendarToolbarProps
 * @property {string} formattedHeaderTitle - Título formateado de fecha o rango semanal.
 * @property {boolean} isDayView - Indica si el modo activo es vista diaria.
 * @property {boolean} isWeekView - Indica si el modo activo es vista semanal.
 * @property {() => void} onNext - Handler para avanzar fecha o semana.
 * @property {() => void} onPrevious - Handler para retroceder fecha o semana.
 * @property {() => void} onSwitchToDayView - Handler para activar vista diaria.
 * @property {() => void} onSwitchToWeekView - Handler para activar vista semanal.
 * @property {() => void} onToday - Handler para ir a la fecha actual.
 */
export interface AgendaCalendarToolbarProps {
  readonly formattedHeaderTitle: string;
  readonly isDayView: boolean;
  readonly isWeekView: boolean;
  readonly onNext: () => void;
  readonly onPrevious: () => void;
  readonly onSwitchToDayView: () => void;
  readonly onSwitchToWeekView: () => void;
  readonly onToday: () => void;
}
