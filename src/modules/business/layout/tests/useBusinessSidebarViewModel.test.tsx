import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { FC, ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { Session } from "@/modules/auth";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { testI18n } from "@/shared/test-utils/testI18n";
import { useBusinessSidebarViewModel } from "../hooks";

const createWrapper = (
  session: Session = SUBSCRIBER_SESSION,
): FC<{ children: ReactNode }> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const TestWrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={testI18n}>
        <AuthContext.Provider value={{ session }}>
          <MemoryRouter>{children}</MemoryRouter>
        </AuthContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>
  );
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("useBusinessSidebarViewModel (KAN-42)", () => {
  it("KAN-42: AC-KAN-42-04 prompts confirmation dialog when hasUnsavedChanges is true", () => {
    const handleSignOut = vi.fn();

    const { result } = renderHook(
      () =>
        useBusinessSidebarViewModel({
          hasUnsavedChanges: true,
          onSignOut: handleSignOut,
        }),
      {
        wrapper: createWrapper(SUBSCRIBER_SESSION),
      },
    );

    expect(result.current.isSignOutConfirmOpen).toBe(false);

    act(() => {
      result.current.handleSignOut();
    });

    expect(result.current.isSignOutConfirmOpen).toBe(true);
    expect(handleSignOut).not.toHaveBeenCalled();

    // Cancel keeps user on screen
    act(() => {
      result.current.handleCancelSignOut();
    });

    expect(result.current.isSignOutConfirmOpen).toBe(false);
    expect(handleSignOut).not.toHaveBeenCalled();

    // Confirm proceeds with sign out
    act(() => {
      result.current.handleSignOut();
    });
    expect(result.current.isSignOutConfirmOpen).toBe(true);

    act(() => {
      result.current.handleConfirmSignOut();
    });

    expect(result.current.isSignOutConfirmOpen).toBe(false);
    expect(handleSignOut).toHaveBeenCalledTimes(1);
  });

  it("KAN-42: AC-KAN-42-03 proceeds with sign out even if onSignOut handler fails", () => {
    const errorThrowingSignOut = vi.fn().mockImplementation(() => {
      throw new Error("Network error revoking session");
    });

    const { result } = renderHook(
      () =>
        useBusinessSidebarViewModel({
          hasUnsavedChanges: false,
          onSignOut: errorThrowingSignOut,
        }),
      {
        wrapper: createWrapper(SUBSCRIBER_SESSION),
      },
    );

    expect(() => {
      act(() => {
        result.current.handleSignOut();
      });
    }).not.toThrow();

    expect(errorThrowingSignOut).toHaveBeenCalledTimes(1);
  });
});
