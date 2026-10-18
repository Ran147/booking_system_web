/**
 * Elemento de datos representativo de un testimonio.
 */
export interface TestimonialItem {
  /** Nombre del autor o cliente */
  readonly authorName: string;
  /** Nombre del negocio, especialidad o giro comercial */
  readonly businessName: string;
  /** Identificador único del testimonio */
  readonly id: string;
  /** Cita textual o reseña compartida */
  readonly quote: string;
  /** Calificación numérica otorgada (1 a 5) */
  readonly rating: number;
}

/**
 * Contrato del ViewModel para la sección de testimonios de la página principal (KAN-6).
 */
export interface TestimonialsViewModel {
  /** Insignia o categoría superior */
  readonly badge: string;
  /** Indica si existen testimonios válidos para renderizar */
  readonly hasTestimonials: boolean;
  /** Subtítulo descriptivo */
  readonly subtitle: string;
  /** Lista inmutable de testimonios válidos y filtrados */
  readonly testimonials: readonly TestimonialItem[];
  /** Título principal de la sección */
  readonly title: string;
}
