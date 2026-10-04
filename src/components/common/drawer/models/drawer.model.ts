import type { ReactNode } from "react";
import type { DRAWER_POSITION } from "../constants/drawer.constants";

export type DrawerPosition =
  (typeof DRAWER_POSITION)[keyof typeof DRAWER_POSITION];

/**
 * Propiedades del atomo Drawer.
 */
export interface DrawerProps {
  readonly backdropTestId?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly isOpen: boolean;
  readonly onClose?: () => void;
  readonly position?: DrawerPosition;
  readonly testId?: string;
}
