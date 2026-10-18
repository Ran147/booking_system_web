import { renderHook } from "@testing-library/react";
import type { FC, ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { testI18n } from "@/shared/test-utils/testI18n";
import { TESTIMONIALS_CONSTANTS } from "../constants/Testimonials.constants";
import { useTestimonialsViewModel } from "../hooks/useTestimonialsViewModel";

const createWrapper = (): FC<{ children: ReactNode }> => {
  const TestWrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
  );
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("useTestimonialsViewModel", () => {
  it("initializes with testimonials and translated header copy", () => {
    const { result } = renderHook(() => useTestimonialsViewModel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasTestimonials).toBe(true);
    expect(result.current.badge).toBeTruthy();
    expect(result.current.title).toBeTruthy();
    expect(result.current.subtitle).toBeTruthy();
    expect(result.current.testimonials).toHaveLength(3);

    const [firstTestimonial] = result.current.testimonials;
    expect(firstTestimonial).toBeDefined();
    expect(firstTestimonial?.authorName).toBeTruthy();
    expect(firstTestimonial?.businessName).toBeTruthy();
    expect(firstTestimonial?.quote).toBeTruthy();
    expect(firstTestimonial?.rating).toBe(5);
  });

  it("filters out testimonials whose quote translation is missing or unconfigured", () => {
    const secondItem = TESTIMONIALS_CONSTANTS.ITEMS[1];
    const existsSpy = vi.spyOn(testI18n, "exists").mockImplementation((key) => {
      if (secondItem && key === secondItem.QUOTE_KEY) {
        return false;
      }
      return true;
    });

    const { result } = renderHook(() => useTestimonialsViewModel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasTestimonials).toBe(true);
    expect(result.current.testimonials).toHaveLength(2);
    expect(
      result.current.testimonials.some(
        (item) => Boolean(secondItem && item.id === secondItem.ID),
      ),
    ).toBe(false);

    existsSpy.mockRestore();
  });

  it("sets hasTestimonials to false and returns empty testimonials array when all quotes are missing", () => {
    const existsSpy = vi.spyOn(testI18n, "exists").mockReturnValue(false);

    const { result } = renderHook(() => useTestimonialsViewModel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasTestimonials).toBe(false);
    expect(result.current.testimonials).toHaveLength(0);

    existsSpy.mockRestore();
  });
});
