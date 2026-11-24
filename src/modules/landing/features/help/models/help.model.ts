import type { ComponentType } from "react";

/**
 * Tópico o guía rápida de ayuda.
 */
export interface HelpTopicItem {
  readonly description: string;
  readonly icon: ComponentType<{ readonly className?: string }>;
  readonly id: string;
  readonly steps: readonly string[];
  readonly title: string;
}

/**
 * Propiedades del componente HelpTopicCard.
 */
export interface HelpTopicCardProps {
  readonly className?: string;
  readonly topic: HelpTopicItem;
}

/**
 * Propiedades del componente HelpSupportBanner.
 */
export interface HelpSupportBannerProps {
  readonly className?: string;
  readonly isSubscriber: boolean;
  readonly onGoToContact: () => void;
  readonly onGoToFaq: () => void;
  readonly onGoToSupportTickets: () => void;
}

/**
 * Estado y manejadores expuestos por el hook useHelpViewModel.
 */
export interface HelpViewModel {
  readonly handleGoToContact: () => void;
  readonly handleGoToFaq: () => void;
  readonly handleGoToSupportTickets: () => void;
  readonly isSubscriber: boolean;
  readonly topics: readonly HelpTopicItem[];
}
