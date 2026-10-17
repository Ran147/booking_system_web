/**
 * Item descriptivo de caracteristica destacada de la plataforma.
 */
export interface PlatformIntroFeature {
  readonly description: string;
  readonly key: string;
}

/**
 * Contrato del ViewModel para la seccion de introduccion de la plataforma (KAN-4).
 */
export interface PlatformIntroViewModel {
  /** Insignia o subtitulo superior de la seccion */
  readonly badge: string;
  /** Lista de caracteristicas principales destacadas */
  readonly features: readonly PlatformIntroFeature[];
  /** Texto detallado expandible */
  readonly fullText: string;
  /** Accion de alternancia para expandir o colapsar el texto */
  readonly handleToggle: () => void;
  /** Indica si existe texto extendido valido para mostrar la accion de expansion */
  readonly hasFullText: boolean;
  /** Estado de visibilidad del texto extendido */
  readonly isExpanded: boolean;
  /** Resumen inicial conciso de la propuesta */
  readonly summary: string;
  /** Titulo principal de la seccion */
  readonly title: string;
  /** Etiqueta contextual para el boton de alternancia ("Leer mas" o "Leer menos") */
  readonly toggleButtonLabel: string;
}
