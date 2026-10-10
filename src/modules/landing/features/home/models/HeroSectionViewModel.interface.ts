/**
 * View model contract for the Hero section in the public landing portal (KAN-2).
 */
export interface HeroSectionViewModel {
  /** Localized badge text displayed above the main headline. */
  readonly badgeLabel: string;
  /** Localized primary headline text. */
  readonly title: string;
  /** Localized tagline / value proposition description. */
  readonly tagline: string;
  /** Localized label for the call to action button. */
  readonly ctaLabel: string;
  /** Accessible callback to scroll smoothly to the plans section. */
  readonly handleCtaClick: () => void;
}
