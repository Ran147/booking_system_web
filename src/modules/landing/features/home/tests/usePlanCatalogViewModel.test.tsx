import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { VIEW_STATE } from "@/shared/constants";
import { PLAN_STATUS } from "@/shared/domain";
import { testI18n } from "@/shared/test-utils";
import * as fetchActivePlansModule from "../api/fetchActivePlans";
import { usePlanCatalogViewModel } from "../hooks/usePlanCatalogViewModel";
import type { Plan } from "../models/Plan.interface";

const mockPlans: Plan[] = [
  {
    billingPeriod: "annual",
    features: ["Feature A"],
    id: "plan-2",
    limits: { maxBookings: 100 },
    name: "Enterprise",
    priceInCents: 9900,
    status: PLAN_STATUS.ACTIVE,
  },
  {
    billingPeriod: "monthly",
    features: ["Feature B"],
    id: "plan-1",
    limits: { maxBookings: 10 },
    name: "Starter",
    priceInCents: 1900,
    status: PLAN_STATUS.ACTIVE,
  },
];

const createWrapper = (): (({
  children,
}: {
  children: ReactNode;
}) => ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const TestWrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={testI18n}>
        <MemoryRouter>{children}</MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );

  TestWrapper.displayName = "TestWrapper";

  return TestWrapper;
};

describe("usePlanCatalogViewModel", () => {
  it("sorts plans by price ascending and sets ready viewState", async () => {
    vi.spyOn(fetchActivePlansModule, "fetchActivePlans").mockResolvedValueOnce(
      mockPlans,
    );

    const { result } = renderHook(() => usePlanCatalogViewModel(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.viewState).toBe(VIEW_STATE.READY);
    });

    expect(result.current.plans).toHaveLength(2);
    expect(result.current.plans[0]?.name).toBe("Starter");
    expect(result.current.plans[1]?.name).toBe("Enterprise");
  });

  it("handles empty plans list and sets empty viewState", async () => {
    vi.spyOn(fetchActivePlansModule, "fetchActivePlans").mockResolvedValueOnce(
      [],
    );

    const { result } = renderHook(() => usePlanCatalogViewModel(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.viewState).toBe(VIEW_STATE.EMPTY);
    });

    expect(result.current.plans).toHaveLength(0);
  });
});
