import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { testI18n } from "@/test-utils/testI18n";
import { useAboutViewModel } from "../hooks/useAboutViewModel";

const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
  <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
);

describe("useAboutViewModel (US-16 / KAN-16)", () => {
  it("provides localized milestones, offerings, and stats", () => {
    const { result } = renderHook(() => useAboutViewModel(), { wrapper });

    expect(result.current.milestones).toHaveLength(3);
    result.current.milestones.forEach((milestone) => {
      expect(milestone.id).toBeTruthy();
      expect(milestone.year).toBeTruthy();
      expect(milestone.title).toBeTruthy();
      expect(milestone.description).toBeTruthy();
    });

    expect(result.current.offerings).toHaveLength(4);
    result.current.offerings.forEach((offering) => {
      expect(offering.id).toBeTruthy();
      expect(offering.icon).toBeTruthy();
      expect(offering.title).toBeTruthy();
      expect(offering.description).toBeTruthy();
    });

    expect(result.current.stats).toHaveLength(4);
    result.current.stats.forEach((stat) => {
      expect(stat.id).toBeTruthy();
      expect(stat.label).toBeTruthy();
      expect(stat.value).toBeTruthy();
    });
  });
});
