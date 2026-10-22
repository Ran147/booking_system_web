import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, ErrorState } from "@/shared/components";
import { I18N_NAMESPACE, VIEW_STATE } from "@/shared/constants";
import { PlanCard } from "./PlanCard";
import { PlanCatalogSkeleton } from "./PlanCatalogSkeleton";
import { PLAN_CATALOG_CONSTANTS } from "../constants/PlanCatalog.constants";
import { usePlanCatalogViewModel } from "../hooks/usePlanCatalogViewModel";

export const PlanCatalogSection = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const viewModel = usePlanCatalogViewModel();

  return (
    <section
      aria-labelledby="plans-heading"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      id="plans-section"
    >
      <div className="mb-10 text-center">
        <h2
          className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          id="plans-heading"
        >
          {t("home.plans.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-xl text-muted-foreground">
          {t("home.plans.subtitle")}
        </p>
      </div>

      {viewModel.viewState === VIEW_STATE.LOADING && <PlanCatalogSkeleton />}

      {viewModel.viewState === VIEW_STATE.ERROR && (
        <div className="flex flex-col items-center gap-4">
          <ErrorState />
          <Button onClick={viewModel.retry} variant="outline">
            {t("home.plans.retry")}
          </Button>
        </div>
      )}

      {viewModel.viewState === VIEW_STATE.EMPTY && (
        <EmptyState message={viewModel.emptyMessage} />
      )}

      {viewModel.viewState === VIEW_STATE.READY && (
        <div className={PLAN_CATALOG_CONSTANTS.GRID_LAYOUT}>
          {viewModel.plans.map((plan) => (
            <PlanCard
              key={plan.id}
              onSelectPlan={viewModel.handleSelectPlan}
              plan={plan}
            />
          ))}
        </div>
      )}
    </section>
  );
};
