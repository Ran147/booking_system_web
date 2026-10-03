import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PLAN_STATUS } from "@/shared/domain";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/shared/test-utils";
import { createPlanCatalogSectionPage } from "./PlanCatalogSection.page";
import * as fetchActivePlansModule from "../api/fetchActivePlans";
import { PlanCatalogSection } from "../components/PlanCatalogSection";
import type { Plan } from "../models/Plan.interface";

const mockPlans: Plan[] = [
  {
    billingPeriod: "monthly",
    features: ["Hasta 50 reservas", "Soporte básico"],
    id: "plan-pro",
    limits: { maxBookings: 50 },
    name: "Plan Profesional",
    priceInCents: 2900,
    status: PLAN_STATUS.ACTIVE,
  },
  {
    billingPeriod: "monthly",
    features: ["Hasta 10 reservas", "Recordatorios básicos"],
    id: "plan-basic",
    limits: { maxBookings: 10 },
    name: "Plan Básico",
    priceInCents: 1500,
    status: PLAN_STATUS.ACTIVE,
  },
];

describe("PlanCatalogSection (KAN-7)", () => {
  it("KAN-7: renders active plans ordered by price ascending", async () => {
    vi.spyOn(fetchActivePlansModule, "fetchActivePlans").mockResolvedValueOnce(
      mockPlans,
    );

    renderWithProviders(<PlanCatalogSection />, {
      initialPath: "/",
      session: SIGNED_OUT_SESSION,
    });

    const page = createPlanCatalogSectionPage();

    await waitFor(() => {
      expect(screen.getByText("Plan Básico")).toBeInTheDocument();
      expect(screen.getByText("Plan Profesional")).toBeInTheDocument();
    });

    const planCards = page.getPlanCards();
    expect(planCards).toHaveLength(2);
    expect(planCards[0]).toHaveTextContent("Plan Básico");
    expect(planCards[1]).toHaveTextContent("Plan Profesional");
  });

  it("KAN-7: renders empty state when no active plans are found", async () => {
    vi.spyOn(fetchActivePlansModule, "fetchActivePlans").mockResolvedValueOnce(
      [],
    );

    renderWithProviders(<PlanCatalogSection />, {
      initialPath: "/",
      session: SIGNED_OUT_SESSION,
    });

    const page = createPlanCatalogSectionPage();

    await waitFor(() => {
      expect(page.getEmptyState()).toBeInTheDocument();
    });
  });

  it("KAN-7: renders error state and triggers retry when fetch fails", async () => {
    const fetchSpy = vi
      .spyOn(fetchActivePlansModule, "fetchActivePlans")
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(mockPlans);

    renderWithProviders(<PlanCatalogSection />, {
      initialPath: "/",
      session: SIGNED_OUT_SESSION,
    });

    const page = createPlanCatalogSectionPage();

    await waitFor(() => {
      expect(page.getErrorState()).toBeInTheDocument();
    });

    const retryButton = page.getRetryButton();
    expect(retryButton).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(retryButton as HTMLElement);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Plan Básico")).toBeInTheDocument();
    });
  });
});
