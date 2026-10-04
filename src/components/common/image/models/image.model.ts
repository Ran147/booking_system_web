import type { ImgHTMLAttributes } from "react";

/**
 * Propiedades del atomo Image.
 */
export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  readonly alt: string;
  readonly className?: string;
  readonly loading?: "eager" | "lazy";
  readonly src: string;
}
