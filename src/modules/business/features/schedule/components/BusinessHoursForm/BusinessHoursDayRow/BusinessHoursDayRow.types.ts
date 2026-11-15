/**
 * @file Contratos de tipos para una fila de día en el formulario de horarios.
 */

import type { BusinessHoursDayRow as BusinessHoursDayRowModel } from "@/modules/business/features/schedule";

/**
 * @typedef {Object} BusinessHoursDayRowProps
 * @property {BusinessHoursDayRowModel} dayRow - Estado y callbacks preconfigurados del día.
 */
export interface BusinessHoursDayRowProps {
  readonly dayRow: BusinessHoursDayRowModel;
}

