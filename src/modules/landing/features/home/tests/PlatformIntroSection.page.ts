import { screen } from "@testing-library/react";
import type { Nullable } from "@/shared/types";
import { PLATFORM_INTRO_CONSTANTS } from "../constants/PlatformIntro.constants";

export interface PlatformIntroSectionPage {
  readonly getBadge: () => Nullable<HTMLElement>;
  readonly getFeatures: () => HTMLElement[];
  readonly getFullTextContainer: () => Nullable<HTMLElement>;
  readonly getFullTextParagraph: () => Nullable<HTMLElement>;
  readonly getHeading: () => Nullable<HTMLElement>;
  readonly getSection: () => Nullable<HTMLElement>;
  readonly getSummary: () => Nullable<HTMLElement>;
  readonly getToggleButton: () => Nullable<HTMLElement>;
}

export const createPlatformIntroSectionPage = (): PlatformIntroSectionPage => ({
  getBadge: (): Nullable<HTMLElement> =>
    screen.queryByText(
      /¿Por qué elegir Booking System\?|Why choose Booking System\?/i,
    ),
  getFeatures: (): HTMLElement[] =>
    screen.queryAllByText(
      /recordatorios|disponibilidad|reminders|scheduling|payments|opciones de pago/i,
    ),
  getFullTextContainer: (): Nullable<HTMLElement> =>
    document.getElementById(PLATFORM_INTRO_CONSTANTS.FULL_TEXT_CONTAINER_ID),
  getFullTextParagraph: (): Nullable<HTMLElement> =>
    screen.queryByText(
      /Nuestra solución fue diseñada|Our platform is tailored/i,
    ),
  getHeading: (): Nullable<HTMLElement> =>
    screen.queryByRole("heading", { level: 2 }),
  getSection: (): Nullable<HTMLElement> =>
    document.getElementById(PLATFORM_INTRO_CONSTANTS.CONTAINER_SECTION_ID),
  getSummary: (): Nullable<HTMLElement> =>
    screen.queryByText(
      /Booking System es la plataforma integral|Booking System is the all-in-one/i,
    ),
  getToggleButton: (): Nullable<HTMLElement> =>
    screen.queryByRole("button", {
      name: /leer más|leer menos|read more|read less/i,
    }),
});
