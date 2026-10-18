import { act, renderHook } from "@testing-library/react";
import type { FC, ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import type * as ReactRouter from "react-router";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { testI18n } from "@/test-utils/testI18n";
import { FAQ_CONSTANTS } from "../constants/faq.constants";
import { useFaqViewModel } from "../hooks/useFaqViewModel";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof ReactRouter>("react-router");
  return {
    ...actual,
    useNavigate: (): typeof mockNavigate => mockNavigate,
  };
});

const createTestWrapper = (): FC<{ children: ReactNode }> => {
  const TestWrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter initialEntries={[ROUTE_PATH.LANDING.FAQ]}>
        {children}
      </MemoryRouter>
    </I18nextProvider>
  );
  TestWrapper.displayName = "FaqViewModelTestWrapper";
  return TestWrapper;
};

describe("useFaqViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads categorized groups and starts with collapsed items", () => {
    const { result } = renderHook(() => useFaqViewModel(), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.isEmpty).toBe(false);
    expect(result.current.groups.length).toBeGreaterThan(0);
    expect(result.current.expandedItemIds.size).toBe(0);

    const groupIds = result.current.groups.map((group) => group.id);
    expect(groupIds).toContain(FAQ_CONSTANTS.GROUP_IDS.SERVICES_AND_BOOKINGS);
    expect(groupIds).toContain(FAQ_CONSTANTS.GROUP_IDS.PLANS_AND_BILLING);
    expect(groupIds).toContain(FAQ_CONSTANTS.GROUP_IDS.ACCOUNT_AND_SECURITY);
  });

  it("toggles item expansion state on toggleItem", () => {
    const { result } = renderHook(() => useFaqViewModel(), {
      wrapper: createTestWrapper(),
    });

    act(() => {
      result.current.toggleItem("client-booking");
    });

    expect(result.current.expandedItemIds.has("client-booking")).toBe(true);

    act(() => {
      result.current.toggleItem("client-booking");
    });

    expect(result.current.expandedItemIds.has("client-booking")).toBe(false);
  });

  it("navigates to contact page when handleGoToContact is triggered", () => {
    const { result } = renderHook(() => useFaqViewModel(), {
      wrapper: createTestWrapper(),
    });

    result.current.handleGoToContact();
    expect(mockNavigate).toHaveBeenCalledWith(ROUTE_PATH.LANDING.CONTACT);
  });
});
