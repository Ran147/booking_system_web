import type { ComponentType, HTMLAttributes, ReactNode } from "react";
import type { BADGE_VARIANT } from "../constants/badge.constants";

export type BadgeVariant = (typeof BADGE_VARIANT)[keyof typeof BADGE_VARIANT];

/**
 * Propiedades del átomo Badge.
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly children: ReactNode;
  readonly className?: string;
  readonly leftIcon?: ComponentType<{ readonly className?: string }>;
  readonly variant?: BadgeVariant;
}
