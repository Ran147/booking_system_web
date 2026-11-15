/**
 * @file Contratos de tipos para la vista semanal de la agenda.
 */

import type {
  AgendaBlockViewItem,
  AgendaWeekDayViewItem,
} from "@/modules/business/features/schedule";

/**
 * @typedef {Object} AgendaWeekViewProps
 * @property {readonly AgendaBlockViewItem[]} allBlocks - Lista de bloqueos activos ordenados.
 * @property {boolean} hasDeleteBlockAction - Indica si el usuario puede eliminar bloqueos.
 * @property {readonly AgendaWeekDayViewItem[]} weekDays - Días de la semana preparados para UI.
 */
export interface AgendaWeekViewProps {
  readonly allBlocks: readonly AgendaBlockViewItem[];
  readonly hasDeleteBlockAction: boolean;
  readonly weekDays: readonly AgendaWeekDayViewItem[];
}

