import type { TermsLegalClause } from "../models/TermsViewModel.interface";

/**
 * Props para el componente TermsSectionCard.
 */
export interface TermsSectionCardProps {
  /** Cláusula legal a mostrar */
  readonly clause: TermsLegalClause;
  /** Clases CSS opcionales */
  readonly className?: string;
}
