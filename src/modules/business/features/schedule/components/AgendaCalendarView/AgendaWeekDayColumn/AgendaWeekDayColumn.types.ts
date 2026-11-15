/**
 * @file Contratos de tipos para la columna diaria dentro de la vista semanal.
 */

import type { AgendaWeekDayViewItem } from "@/modules/business/features/schedule";

/**
 * @typedef {Object} AgendaWeekDayColumnProps
 * @property {AgendaWeekDayViewItem} dayItem - Datos preparados del día para la grilla semanal.
 */
export interface AgendaWeekDayColumnProps {
  readonly dayItem: AgendaWeekDayViewItem;
}

