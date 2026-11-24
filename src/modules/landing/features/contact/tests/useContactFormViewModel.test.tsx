import { act, renderHook } from "@testing-library/react";
import type { FC, ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { testI18n } from "@/test-utils/testI18n";
import { useContactFormViewModel } from "../hooks/useContactFormViewModel";

const createTestWrapper = (): FC<{ children: ReactNode }> => {
  const TestWrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
  );
  TestWrapper.displayName = "ContactFormViewModelTestWrapper";
  return TestWrapper;
};

describe("useContactFormViewModel", () => {
  it("initializes with empty default values and disabled submit", () => {
    const { result } = renderHook(() => useContactFormViewModel(), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.isSubmitDisabled).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.serverError).toBeNull();
    expect(result.current.recaptchaResetSignal).toBe(0);
    expect(result.current.fieldErrors).toEqual({
      email: undefined,
      message: undefined,
      name: undefined,
      subject: undefined,
    });
  });

  it("enables submit when recaptcha token is supplied", async () => {
    const { result } = renderHook(() => useContactFormViewModel(), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.isSubmitDisabled).toBe(true);

    await act(async () => {
      result.current.handleRecaptchaTokenChange("test-token");
    });

    expect(result.current.isSubmitDisabled).toBe(false);
  });

  it("clears feedback on handleDismissFeedback", () => {
    const { result } = renderHook(() => useContactFormViewModel(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.handleDismissFeedback();
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.serverError).toBeNull();
  });
});
