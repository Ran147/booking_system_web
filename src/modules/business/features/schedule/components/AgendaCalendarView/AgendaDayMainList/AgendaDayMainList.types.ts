/**
 * @file Contratos de tipos para la lista principal del día en la agenda.
 */

import type {
  AgendaBlockViewItem,
  AgendaBookingViewItem,
} from "@/modules/business/features/schedule";

/**
 * @typedef {Object} AgendaDayMainListProps
 * @property {readonly AgendaBookingViewItem[]} bookings - Citas del día seleccionado.
 * @property {boolean} hasDeleteBlockAction - Indica si se pueden eliminar bloqueos.
 * @property {boolean} isEmpty - Indica si el día no tiene citas ni bloqueos parciales.
 * @property {readonly AgendaBlockViewItem[]} timedBlocks - Bloqueos parciales del día.
 * @property {string} timeZone - Zona horaria IANA del negocio.
 */
export interface AgendaDayMainListProps {
  readonly bookings: readonly AgendaBookingViewItem[];
  readonly hasDeleteBlockAction: boolean;
  readonly isEmpty: boolean;
  readonly timedBlocks: readonly AgendaBlockViewItem[];
  readonly timeZone: string;
}

