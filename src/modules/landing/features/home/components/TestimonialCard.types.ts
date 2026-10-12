import type { TestimonialItem } from "../models/TestimonialsViewModel.interface";

/**
 * Props para el componente TestimonialCard.
 */
export interface TestimonialCardProps {
  /** Clases CSS opcionales */
  readonly className?: string;
  /** Datos del testimonio a renderizar */
  readonly testimonial: TestimonialItem;
}
