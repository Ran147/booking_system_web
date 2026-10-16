import { screen } from "@testing-library/react";
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
    screen.queryByText(/Historias de clientes|Customer stories/i),
  getHeading: (): Nullable<HTMLElement> =>
    screen.queryByRole("heading", { level: 2 }),
  getSection: (): Nullable<HTMLElement> =>
    document.getElementById(TESTIMONIALS_CONSTANTS.CONTAINER_SECTION_ID),
  getStarRatings: (): HTMLElement[] =>
    screen.queryAllByRole("img", { name: /calificación/i }),
  getSubtitle: (): Nullable<HTMLElement> =>
    screen.queryByText(
      /Descubre cómo profesionales|Discover how service professionals/i,
    ),
  getTestimonialCards: (): HTMLElement[] =>
    screen
      .queryAllByRole("img", { name: /calificación/i })
      .map((starElement) => {
        return (
          (starElement.closest(".border-border") as HTMLElement) ?? starElement
        );
      }),
});
