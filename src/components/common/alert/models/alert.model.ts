import type { HTMLAttributes, ReactNode } from "react";
import type { ALERT_VARIANT } from "../constants/alert.constants";

export type AlertVariant = (typeof ALERT_VARIANT)[keyof typeof ALERT_VARIANT];

/**
 * @typedef {Object} AlertProps
 * @property {ReactNode} children - Mensaje ya traducido que se anuncia.
 * @property {string} [className] - Clases extra del contenedor.
 * @property {AlertVariant} [variant] - Tono del mensaje (destructive por defecto).
 */
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly className?: string;
  readonly variant?: AlertVariant;
}
