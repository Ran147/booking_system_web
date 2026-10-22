import { screen } from "@testing-library/react";
import type { Nullable } from "@/shared/types";

export interface PlanCatalogSectionPage {
  readonly getEmptyState: () => Nullable<HTMLElement>;
  readonly getErrorState: () => Nullable<HTMLElement>;
  readonly getPlanCards: () => HTMLElement[];
  readonly getRetryButton: () => Nullable<HTMLElement>;
  readonly getSkeleton: () => Nullable<HTMLElement>;
}

export const createPlanCatalogSectionPage = (): PlanCatalogSectionPage => ({
  getEmptyState: (): Nullable<HTMLElement> =>
    screen.queryByText(/no hay planes de suscripción disponibles/i),
  getErrorState: (): Nullable<HTMLElement> => screen.queryByRole("alert"),
  getPlanCards: (): HTMLElement[] =>
    screen
      .queryAllByRole("button", { name: /comenzar/i })
      .map(
        (button) =>
          button.closest(".flex.h-full.flex-col") as Nullable<HTMLElement>,
      )
      .filter((card): card is HTMLElement => card !== null),
  getRetryButton: (): Nullable<HTMLElement> =>
    screen.queryByRole("button", { name: /reintentar/i }),
  getSkeleton: (): Nullable<HTMLElement> =>
    screen.queryByTestId("plan-catalog-skeleton"),
});
