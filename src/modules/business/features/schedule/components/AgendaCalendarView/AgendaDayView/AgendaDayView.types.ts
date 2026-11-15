/**
 * @file Contratos de tipos para la vista diaria de la agenda.
 */

import type {
  AgendaBlockViewItem,
  AgendaDayViewData,
} from "@/modules/business/features/schedule";

/**
 * @typedef {Object} AgendaDayViewProps
 * @property {readonly AgendaBlockViewItem[]} allBlocks - Todos los bloqueos activos ordenados.
 * @property {AgendaDayViewData} dayView - Datos preparados para el día seleccionado.
 * @property {boolean} hasDeleteBlockAction - Indica si el usuario puede eliminar bloqueos.
 * @property {string} timeZone - Zona horaria IANA del negocio.
 */
export interface AgendaDayViewProps {
  readonly allBlocks: readonly AgendaBlockViewItem[];
  readonly dayView: AgendaDayViewData;
  readonly hasDeleteBlockAction: boolean;
  readonly timeZone: string;
}
