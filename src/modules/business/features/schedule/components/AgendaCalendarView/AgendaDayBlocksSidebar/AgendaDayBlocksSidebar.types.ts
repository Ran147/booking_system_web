/**
 * @file Contratos de tipos para el panel lateral de bloqueos en la vista diaria.
 */

import type { AgendaBlockViewItem } from "@/modules/business/features/schedule";

/**
 * @typedef {Object} AgendaDayBlocksSidebarProps
 * @property {readonly AgendaBlockViewItem[]} allBlocks - Todos los bloqueos activos ordenados.
 * @property {readonly AgendaBlockViewItem[]} currentDayBlocks - Bloqueos correspondientes a la fecha seleccionada.
 * @property {boolean} hasDeleteBlockAction - Indica si el usuario puede eliminar bloqueos.
 */
export interface AgendaDayBlocksSidebarProps {
  readonly allBlocks: readonly AgendaBlockViewItem[];
  readonly currentDayBlocks: readonly AgendaBlockViewItem[];
  readonly hasDeleteBlockAction: boolean;
}

