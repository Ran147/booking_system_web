import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/shared/constants";
import type { Nullable } from "@/shared/types";

export interface HeroSectionPageObject {
  readonly clickCtaButton: () => Promise<void>;
  readonly getBadge: () => Nullable<HTMLElement>;
  readonly getCtaButton: () => HTMLElement;
  readonly getHeading: () => HTMLElement;
  readonly getTagline: () => HTMLElement;
}

export const createHeroSectionPage = (): HeroSectionPageObject => {
  const user = userEvent.setup();

  return {
    clickCtaButton: async (): Promise<void> => {
      const ctaButton = screen.getByRole(ARIA_ROLE.BUTTON);
      await user.click(ctaButton);
    },
    getBadge: (): Nullable<HTMLElement> =>
      screen.queryByText(/gestión de citas y reservas/i),
    getCtaButton: (): HTMLElement => screen.getByRole(ARIA_ROLE.BUTTON),
    getHeading: (): HTMLElement =>
      screen.getByRole(ARIA_ROLE.HEADING, { level: 1 }),
    getTagline: (): HTMLElement =>
      screen.getByText(/simplifica la agenda de tu negocio/i),
  };
};
