import { renderHook } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { testI18n } from "@/shared/test-utils";
import { useHeroSectionViewModel } from "../hooks/useHeroSectionViewModel";

const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
);

describe("useHeroSectionViewModel", () => {
  it("provides localized labels and cta handler", () => {
    const { result } = renderHook(() => useHeroSectionViewModel(), {
      wrapper: Wrapper,
    });

    expect(result.current.badgeLabel).toBeTruthy();
    expect(result.current.title).toBeTruthy();
    expect(result.current.tagline).toBeTruthy();
    expect(result.current.ctaLabel).toBeTruthy();
    expect(typeof result.current.handleCtaClick).toBe("function");
  });
});
