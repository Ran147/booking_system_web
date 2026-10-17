import { act, renderHook } from "@testing-library/react";
import type { FC, ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { testI18n } from "@/shared/test-utils/testI18n";
import { PLATFORM_INTRO_CONSTANTS } from "../constants/PlatformIntro.constants";
import { usePlatformIntroViewModel } from "../hooks/usePlatformIntroViewModel";

const createWrapper = (): FC<{ children: ReactNode }> => {
  const TestWrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
  );
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("usePlatformIntroViewModel", () => {
  it("initializes with collapsed state and valid text properties", () => {
    const { result } = renderHook(() => usePlatformIntroViewModel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isExpanded).toBe(false);
    expect(result.current.hasFullText).toBe(true);
    expect(result.current.badge).toBeTruthy();
    expect(result.current.title).toBeTruthy();
    expect(result.current.summary).toBeTruthy();
    expect(result.current.fullText).toBeTruthy();
    expect(result.current.features.length).toBe(3);
    expect(result.current.toggleButtonLabel).toBeTruthy();
    expect(result.current.fullText).not.toBe(
      PLATFORM_INTRO_CONSTANTS.FULL_TEXT_KEY,
    );
  });

  it("toggles isExpanded state when handleToggle is executed", () => {
    const { result } = renderHook(() => usePlatformIntroViewModel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isExpanded).toBe(false);

    act(() => {
      result.current.handleToggle();
    });

    expect(result.current.isExpanded).toBe(true);

    act(() => {
      result.current.handleToggle();
    });

    expect(result.current.isExpanded).toBe(false);
  });
});
