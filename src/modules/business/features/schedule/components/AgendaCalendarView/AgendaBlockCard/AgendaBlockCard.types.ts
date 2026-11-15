/**
 * @file Contratos de tipos para la tarjeta de bloqueo de agenda.
 */

import type { AgendaBlockViewItem } from "@/modules/business/features/schedule";

/**
 * @typedef {Object} AgendaBlockCardProps
 * @property {AgendaBlockViewItem} blockItem - Bloqueo preparado para presentación.
 * @property {boolean} hasDeleteAction - Indica si se permite eliminar el bloqueo.
 * @property {boolean} [isHighlighted] - Indica si la tarjeta debe resaltarse.
 * @property {() => void} onGoToDate - Acción al pulsar el botón para ir a la fecha.
 */
export interface AgendaBlockCardProps {
  readonly blockItem: AgendaBlockViewItem;
  readonly hasDeleteAction: boolean;
  readonly isHighlighted?: boolean;
  readonly onGoToDate: () => void;
}

