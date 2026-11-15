/**
 * @file Contratos de tipos para la tarjeta de horarios semanales del negocio.
 */

import type { BusinessHoursDayRow } from "@/modules/business/features/schedule";
import type { Nullable } from "@/types";

/**
 * @typedef {Object} BusinessHoursScheduleCardProps
 * @property {readonly BusinessHoursDayRow[]} dayRows - Filas semanales con sus rangos y acciones.
 * @property {Nullable<string>} errorMessage - Mensaje de error de validación o red.
 * @property {boolean} isSaving - Indica si hay una operación de guardado activa.
 * @property {() => void} onSave - Callback para guardar los horarios.
 * @property {Nullable<string>} successMessage - Mensaje de confirmación de guardado.
 * @property {string} timeZone - Zona horaria IANA del negocio.
 */
export interface BusinessHoursScheduleCardProps {
  readonly dayRows: readonly BusinessHoursDayRow[];
  readonly errorMessage: Nullable<string>;
  readonly isSaving: boolean;
  readonly onSave: () => void;
  readonly successMessage: Nullable<string>;
  readonly timeZone: string;
}

