/**
 * Elemento de pregunta y respuesta individual.
 */
export interface FaqItem {
  readonly answer: string;
  readonly id: string;
  readonly question: string;
}

/**
 * Grupo temático de preguntas frecuentes.
 */
export interface FaqGroup {
  readonly id: string;
  readonly items: readonly FaqItem[];
  readonly title: string;
}

/**
 * Propiedades del componente FaqAccordionItem.
 */
export interface FaqAccordionItemProps {
  readonly className?: string;
  readonly isExpanded: boolean;
  readonly item: FaqItem;
  readonly onToggle: (itemId: string) => void;
}

/**
 * Propiedades del componente FaqGroupSection.
 */
export interface FaqGroupSectionProps {
  readonly className?: string;
  readonly expandedItemIds: ReadonlySet<string>;
  readonly group: FaqGroup;
  readonly onToggleItem: (itemId: string) => void;
}

/**
 * Contrato del ViewModel para la página de FAQ.
 */
export interface FaqViewModel {
  readonly expandedItemIds: ReadonlySet<string>;
  readonly groups: readonly FaqGroup[];
  readonly handleGoToContact: () => void;
  readonly isEmpty: boolean;
  readonly toggleItem: (itemId: string) => void;
}
