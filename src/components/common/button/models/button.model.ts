import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";
import type {
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from "../constants/button.constants";

export type ButtonVariant =
  (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];
export type ButtonSize = (typeof BUTTON_SIZE)[keyof typeof BUTTON_SIZE];

/**
 * Propiedades del átomo Button.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly ariaLabel?: string;
  readonly asChild?: boolean;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly isLoading?: boolean;
  readonly leftIcon?: ComponentType<{ readonly className?: string }>;
  readonly rightIcon?: ComponentType<{ readonly className?: string }>;
  readonly size?: ButtonSize;
  readonly variant?: ButtonVariant;
}
