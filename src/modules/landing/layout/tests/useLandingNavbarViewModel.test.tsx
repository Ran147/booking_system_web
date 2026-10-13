import { act, renderHook } from "@testing-library/react";
import type { FC, ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { Session } from "@/features/auth";
import { AuthContext } from "@/features/auth/context/AuthContext";
import { ROUTE_PATH } from "@/shared/constants";
import {
  SIGNED_OUT_SESSION,
  SUBSCRIBER_SESSION,
  SUPER_ADMIN_SESSION,
} from "@/shared/test-utils";
import { testI18n } from "@/shared/test-utils/testI18n";
import { useLandingNavbarViewModel } from "../hooks/useLandingNavbarViewModel";

const createWrapper = (
  session: Session = SIGNED_OUT_SESSION,
): FC<{ children: ReactNode }> => {
  const TestWrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <I18nextProvider i18n={testI18n}>
      <AuthContext.Provider value={{ session }}>
        <MemoryRouter>{children}</MemoryRouter>
      </AuthContext.Provider>
    </I18nextProvider>
  );
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("useLandingNavbarViewModel", () => {
  it("initializes with mobile menu closed and visitor credentials when signed out", () => {
    const { result } = renderHook(() => useLandingNavbarViewModel(), {
      wrapper: createWrapper(SIGNED_OUT_SESSION),
    });

    expect(result.current.isMobileMenuOpen).toBe(false);
    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.portalActionPath).toBe(ROUTE_PATH.AUTH.SIGN_IN);
    expect(result.current.portalActionLabel).toBe(
      testI18n.t("landing:home.navbar.signIn"),
    );
    expect(result.current.navLinks).toHaveLength(3);
  });

  it("toggles mobile menu and closes it correctly", () => {
    const { result } = renderHook(() => useLandingNavbarViewModel(), {
      wrapper: createWrapper(SIGNED_OUT_SESSION),
    });

    act(() => {
      result.current.toggleMobileMenu();
    });
    expect(result.current.isMobileMenuOpen).toBe(true);

    act(() => {
      result.current.closeMobileMenu();
    });
    expect(result.current.isMobileMenuOpen).toBe(false);
  });

  it("configures portal destination correctly for subscriber session", () => {
    const { result } = renderHook(() => useLandingNavbarViewModel(), {
      wrapper: createWrapper(SUBSCRIBER_SESSION),
    });

    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.portalActionPath).toBe(ROUTE_PATH.BUSINESS.ROOT);
    expect(result.current.portalActionLabel).toBe(
      testI18n.t("landing:home.navbar.goToPortal"),
    );
  });

  it("configures portal destination correctly for super admin session", () => {
    const { result } = renderHook(() => useLandingNavbarViewModel(), {
      wrapper: createWrapper(SUPER_ADMIN_SESSION),
    });

    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.portalActionPath).toBe(ROUTE_PATH.ADMIN.ROOT);
    expect(result.current.portalActionLabel).toBe(
      testI18n.t("landing:home.navbar.goToPortal"),
    );
  });

  it("handles smooth scroll when navigating to anchor tag", () => {
    const scrollIntoViewMock = vi.fn();
    const mockElement = document.createElement("div");
    mockElement.id = "planes-section";
    mockElement.scrollIntoView = scrollIntoViewMock;
    vi.spyOn(document, "getElementById").mockReturnValue(mockElement);

    const { result } = renderHook(() => useLandingNavbarViewModel(), {
      wrapper: createWrapper(SIGNED_OUT_SESSION),
    });

    act(() => {
      result.current.handleNavigate("/#planes-section");
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth" });
    expect(result.current.isMobileMenuOpen).toBe(false);

    vi.restoreAllMocks();
  });
});
