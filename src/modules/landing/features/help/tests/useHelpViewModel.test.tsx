import { renderHook } from "@testing-library/react";
import type { FC, ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import type * as ReactRouter from "react-router";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/modules/auth";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { ROUTE_PATH } from "@/shared/constants";
import { SIGNED_OUT_SESSION, SUBSCRIBER_SESSION } from "@/shared/test-utils";
import { testI18n } from "@/test-utils/testI18n";
import { HELP_PAGE_CONSTANTS } from "../constants/help.constants";
import { useHelpViewModel } from "../hooks/useHelpViewModel";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof ReactRouter>("react-router");
  return {
    ...actual,
    useNavigate: (): typeof mockNavigate => mockNavigate,
  };
});

const createTestWrapper = (
  session: Session = SIGNED_OUT_SESSION,
): FC<{ children: ReactNode }> => {
  const TestWrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <I18nextProvider i18n={testI18n}>
      <AuthContext.Provider value={{ session }}>
        <MemoryRouter initialEntries={[ROUTE_PATH.LANDING.HELP]}>
          {children}
        </MemoryRouter>
      </AuthContext.Provider>
    </I18nextProvider>
  );
  TestWrapper.displayName = "HelpViewModelTestWrapper";
  return TestWrapper;
};

describe("useHelpViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns help topics and identifies non-subscriber visitor", () => {
    const { result } = renderHook(() => useHelpViewModel(), {
      wrapper: createTestWrapper(SIGNED_OUT_SESSION),
    });

    expect(result.current.isSubscriber).toBe(false);
    expect(result.current.topics).toHaveLength(3);
    expect(result.current.topics[0]?.id).toBe(
      HELP_PAGE_CONSTANTS.TOPIC_IDS.GETTING_STARTED,
    );
    expect(result.current.topics[1]?.id).toBe(
      HELP_PAGE_CONSTANTS.TOPIC_IDS.MANAGING_SCHEDULE,
    );
    expect(result.current.topics[2]?.id).toBe(
      HELP_PAGE_CONSTANTS.TOPIC_IDS.SUBSCRIPTIONS_AND_PLANS,
    );
  });

  it("identifies signed-in subscriber", () => {
    const { result } = renderHook(() => useHelpViewModel(), {
      wrapper: createTestWrapper(SUBSCRIBER_SESSION),
    });

    expect(result.current.isSubscriber).toBe(true);
  });

  it("navigates to contact page when handleGoToContact is called", () => {
    const { result } = renderHook(() => useHelpViewModel(), {
      wrapper: createTestWrapper(),
    });

    result.current.handleGoToContact();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATH.LANDING.CONTACT);
  });

  it("navigates to faq section when handleGoToFaq is called", () => {
    const { result } = renderHook(() => useHelpViewModel(), {
      wrapper: createTestWrapper(),
    });

    result.current.handleGoToFaq();
    expect(mockNavigate).toHaveBeenCalledWith(
      `${ROUTE_PATH.LANDING.CONTACT}#faq`,
    );
  });

  it("navigates to business portal when handleGoToSupportTickets is called", () => {
    const { result } = renderHook(() => useHelpViewModel(), {
      wrapper: createTestWrapper(SUBSCRIBER_SESSION),
    });

    result.current.handleGoToSupportTickets();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATH.BUSINESS.ROOT);
  });
});
