import { renderHook } from "@testing-library/react";
import type { FC, ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { testI18n } from "@/shared/test-utils/testI18n";
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
});
