import type { LucideIcon } from "lucide-react";

export interface ContactFaqItem {
  readonly answer: string;
  readonly id: string;
  readonly question: string;
}

export interface ContactChannelItem {
  readonly description: string;
  readonly href?: string;
  readonly icon: LucideIcon;
  readonly id: string;
  readonly isExternal?: boolean;
  readonly label: string;
  readonly title: string;
}

export interface ContactViewModel {
  readonly backToHomeLabel: string;
  readonly brandingTitle: string;
  readonly channels: readonly ContactChannelItem[];
  readonly channelsTitle: string;
  readonly companyDescription: string;
  readonly companyPlansActionLabel: string;
  readonly companyTitle: string;
  readonly faqItems: readonly ContactFaqItem[];
  readonly faqSubtitle: string;
  readonly faqTitle: string;
  readonly handleNavigateToPlans: () => void;
  readonly helpActionLabel: string;
  readonly helpDescription: string;
  readonly helpTitle: string;
  readonly missionDescription: string;
  readonly missionTitle: string;
  readonly pageSubtitle: string;
  readonly pageTitle: string;
  readonly visionDescription: string;
  readonly visionTitle: string;
}
