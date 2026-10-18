/**
 * Cláusula o sección legal individual de los términos y condiciones.
 */
export interface TermsLegalClause {
  /** Texto detallado de la cláusula */
  readonly body: string;
  /** Identificador único de la cláusula */
  readonly id: string;
  /** Título descriptivo de la cláusula */
  readonly title: string;
}

/**
 * Contrato del ViewModel para la página de Términos y Condiciones (KAN-9).
 */
export interface TermsViewModel {
  /** Etiqueta para la acción de retorno a la página de inicio */
  readonly backToHomeLabel: string;
  /** Lista inmutable de cláusulas legales traducidas */
  readonly clauses: readonly TermsLegalClause[];
  /** Acción para navegar a la página principal */
  readonly handleBackToHome: () => void;
  /** Fecha de última actualización formateada */
  readonly lastUpdated: string;
  /** Título principal de la página */
  readonly title: string;
}
