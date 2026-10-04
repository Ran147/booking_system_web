import type { ReactNode } from "react";
import type { MODAL_MAX_WIDTH } from "../constants/modal.constants";

export type ModalMaxWidth =
  (typeof MODAL_MAX_WIDTH)[keyof typeof MODAL_MAX_WIDTH];

/**
 * Propiedades del atomo Modal accesible.
 */
export interface ModalProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly isOpen: boolean;
  readonly maxWidth?: ModalMaxWidth;
  readonly onClose: () => void;
  readonly title?: string;
}
