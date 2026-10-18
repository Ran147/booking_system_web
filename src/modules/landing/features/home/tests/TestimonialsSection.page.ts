import { screen } from "@testing-library/react";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/shared/types";
import { TESTIMONIALS_CONSTANTS } from "../constants/Testimonials.constants";

export interface TestimonialsSectionPage {
  readonly getBadge: () => Nullable<HTMLElement>;
  readonly getHeading: () => Nullable<HTMLElement>;
  readonly getSection: () => Nullable<HTMLElement>;
  readonly getStarRatings: () => HTMLElement[];
  readonly getSubtitle: () => Nullable<HTMLElement>;
  readonly getTestimonialCards: () => HTMLElement[];
}

export const createTestimonialsSectionPage = (): TestimonialsSectionPage => ({
  getBadge: (): Nullable<HTMLElement> =>
    screen.queryByText(
      testI18n.t(`landing:${TESTIMONIALS_CONSTANTS.BADGE_KEY}`),
    ),
  getHeading: (): Nullable<HTMLElement> =>
    screen.queryByRole("heading", { level: 2 }),
  getSection: (): Nullable<HTMLElement> =>
    document.getElementById(TESTIMONIALS_CONSTANTS.CONTAINER_SECTION_ID),
  getStarRatings: (): HTMLElement[] => screen.queryAllByRole("img"),
  getSubtitle: (): Nullable<HTMLElement> =>
    screen.queryByText(
      testI18n.t(`landing:${TESTIMONIALS_CONSTANTS.SUBTITLE_KEY}`),
    ),
  getTestimonialCards: (): HTMLElement[] => screen.queryAllByRole("article"),
});
