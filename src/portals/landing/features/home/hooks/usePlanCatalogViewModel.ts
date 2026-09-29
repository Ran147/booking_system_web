import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import { formatPrice } from "@/shared/utils/format";
import { resolveViewState } from "@/shared/utils/resolveViewState";
import { useActivePlansQuery } from "../api/useActivePlansQuery";
import {
  BILLING_PERIOD,
  PLAN_CATALOG_CONSTANTS,
} from "../constants/PlanCatalog.constants";
import type {
  FormattedPlanCard,
  UsePlanCatalogViewModelReturn,
} from "../models/PlanCatalogViewModel.interface";

export const usePlanCatalogViewModel = (): UsePlanCatalogViewModelReturn => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.LANDING);
  const plansQueryResult = useActivePlansQuery();

  const rawPlans = plansQueryResult.data ?? [];

  // Sort ascending by priceInCents (AS-11)
  const sortedPlans = [...rawPlans].sort(
    (firstPlan, secondPlan) => firstPlan.priceInCents - secondPlan.priceInCents,
  );

  const formattedPlans: FormattedPlanCard[] = sortedPlans.map((plan) => {
    const formattedPrice = formatPrice(
      plan.priceInCents,
      PLAN_CATALOG_CONSTANTS.CURRENCY,
      i18n.language || PLAN_CATALOG_CONSTANTS.DEFAULT_LOCALE,
    );

    const billingPeriodLabel =
      plan.billingPeriod === BILLING_PERIOD.ANNUAL
        ? t("home.plans.billingPeriod.annual")
        : t("home.plans.billingPeriod.monthly");

    const maxBookingsLabel = t("home.plans.limits.maxBookings", {
      count: plan.limits.maxBookings,
    });

    return {
      billingPeriodLabel,
      features: plan.features,
      formattedPrice,
      id: plan.id,
      maxBookingsLabel,
      name: plan.name,
    };
  });

  const viewState = resolveViewState(plansQueryResult, formattedPlans.length);

  const handleSelectPlan = (_planId: string): void => {
    // Intencionalmente vacio mientras se resuelve Q7 (checkout en MVP)
  };

  const retry = (): void => {
    void plansQueryResult.refetch();
  };

  return {
    emptyMessage: t("home.plans.empty"),
    handleSelectPlan,
    plans: formattedPlans,
    retry,
    viewState,
  };
};
