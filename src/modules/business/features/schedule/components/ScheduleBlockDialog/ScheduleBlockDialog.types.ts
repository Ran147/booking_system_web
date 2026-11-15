/**
 * @file Contratos de tipos para el diálogo de creación de bloqueos de agenda.
 */

import type { ScheduleBlockViewModelResult } from "@/modules/business/features/schedule";

/**
 * @typedef {Object} ScheduleBlockDialogProps
 * @property {ScheduleBlockViewModelResult} viewModel - ViewModel de bloqueos de agenda.
 */
export interface ScheduleBlockDialogProps {
  readonly viewModel: ScheduleBlockViewModelResult;
}
