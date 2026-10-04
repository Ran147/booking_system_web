import type { HTMLAttributes, ReactNode } from "react";
import type { CARD_VARIANT } from "../constants/card.constants";

export type CardVariant = (typeof CARD_VARIANT)[keyof typeof CARD_VARIANT];

/**
 * Propiedades del contenedor Card.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly className?: string;
  readonly hoverable?: boolean;
  readonly isSelected?: boolean;
  readonly variant?: CardVariant;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly className?: string;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  readonly children: ReactNode;
  readonly className?: string;
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  readonly children: ReactNode;
  readonly className?: string;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly className?: string;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly className?: string;
}

export interface CardActionProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly className?: string;
}
