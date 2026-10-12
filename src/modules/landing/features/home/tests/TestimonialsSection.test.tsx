import { describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { createTestimonialsSectionPage } from "./TestimonialsSection.page";
import { TestimonialsSection } from "../components/TestimonialsSection";
import { TESTIMONIALS_CONSTANTS } from "../constants/Testimonials.constants";
import * as useTestimonialsViewModelModule from "../hooks/useTestimonialsViewModel";

const TEST_PROVIDER_OPTIONS = {
  initialPath: ROUTE_PATH.LANDING.HOME,
  session: SIGNED_OUT_SESSION,
};

describe("TestimonialsSection (KAN-6)", () => {
  it("AC-KAN-6-01: renders the section with badge, heading, subtitle and testimonial cards", () => {
    renderWithProviders(<TestimonialsSection />, TEST_PROVIDER_OPTIONS);
    const page = createTestimonialsSectionPage();

    expect(page.getSection()).toBeInTheDocument();
    expect(page.getBadge()).toBeInTheDocument();
    expect(page.getHeading()).toHaveTextContent(
      testI18n.t(`landing:${TESTIMONIALS_CONSTANTS.TITLE_KEY}`),
    );
    expect(page.getSubtitle()).toBeInTheDocument();

    const cards = page.getTestimonialCards();
    expect(cards).toHaveLength(3);

    const ratings = page.getStarRatings();
    expect(ratings).toHaveLength(3);
    expect(ratings[0]).toHaveAttribute(
      "aria-label",
      "Calificación: 5 de 5 estrellas",
    );
  });

  it("AC-KAN-6-02: skips testimonials with empty or missing quote", () => {
    const originalHook =
      useTestimonialsViewModelModule.useTestimonialsViewModel;
    vi.spyOn(
      useTestimonialsViewModelModule,
      "useTestimonialsViewModel",
    ).mockImplementation(() => {
      const real = originalHook();
      return {
        ...real,
        testimonials: real.testimonials.slice(0, 1),
      };
    });

    renderWithProviders(<TestimonialsSection />, TEST_PROVIDER_OPTIONS);
    const page = createTestimonialsSectionPage();

    expect(page.getTestimonialCards()).toHaveLength(1);

    vi.restoreAllMocks();
  });

  it("AC-KAN-6-03: renders nothing when there are no available testimonials", () => {
    const originalHook =
      useTestimonialsViewModelModule.useTestimonialsViewModel;
    vi.spyOn(
      useTestimonialsViewModelModule,
      "useTestimonialsViewModel",
    ).mockImplementation(() => {
      const real = originalHook();
      return {
        ...real,
        hasTestimonials: false,
        testimonials: [],
      };
    });

    renderWithProviders(<TestimonialsSection />, TEST_PROVIDER_OPTIONS);
    const page = createTestimonialsSectionPage();

    expect(page.getSection()).not.toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it("AC-KAN-6-04: provides accessible landmark labeling and responsive container styling", () => {
    renderWithProviders(<TestimonialsSection />, TEST_PROVIDER_OPTIONS);
    const page = createTestimonialsSectionPage();

    const section = page.getSection();
    expect(section).toHaveAttribute(
      "aria-labelledby",
      TESTIMONIALS_CONSTANTS.HEADING_ID,
    );
  });
});
