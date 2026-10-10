import { useState } from "react";
import { useTranslation } from "react-i18next";
import { generatePath, useNavigate, useParams } from "react-router";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import {
  ERROR_MESSAGE_KEY,
  I18N_NAMESPACE,
  ROUTE_PATH,
  STRING,
} from "@/shared/constants";
import type { Nullable } from "@/shared/types";
import { formatPrice } from "@/shared/utils/format";
import { useActivePlanDetailsQuery } from "../api/useActivePlanDetailsQuery";
import { useSignOutMutation } from "../api/useSignOutMutation";
import { useVerifyPlanIsActiveMutation } from "../api/useVerifyPlanIsActiveMutation";
import {
  PLAN_BILLING_PERIOD,
  PLAN_DETAIL_CURRENCY,
  PLAN_DETAIL_STATE,
  PLAN_LIMIT_NAME,
  type PlanDetailState,
} from "../constants/PlanDetail.constants";
import type { PlanDetail } from "../models/PlanDetail.interface";
import type {
  ContractError,
  FormattedPlanDetail,
  FormattedPlanLimit,
  PlanDetailPageViewModel,
} from "../models/PlanDetailViewModel.interface";

export const usePlanDetailPageViewModel = (): PlanDetailPageViewModel => {
  const { i18n, t } = useTranslation([
    I18N_NAMESPACE.LANDING,
    I18N_NAMESPACE.COMMON,
  ]);
  const navigate = useNavigate();
  const { planId = STRING.EMPTY } = useParams();
  const session = useSession();
  const activePlansQuery = useActivePlanDetailsQuery();
  const signOutMutation = useSignOutMutation();
  const verifyPlanIsActiveMutation = useVerifyPlanIsActiveMutation();
  const [contractError, setContractError] =
    useState<Nullable<ContractError>>(null);
  const [hasTriedToContractSignedIn, setHasTriedToContractSignedIn] =
    useState<boolean>(false);

  const activePlans = activePlansQuery.data ?? [];
  // An inactive plan is not in the active list, so it reads as a missing one
  // (AC-KAN-21-05).
  const currentPlan = activePlans.find(
    (activePlan) => activePlan.id === planId,
  );
  const isSignedIn = session.status === SESSION_STATUS.SIGNED_IN;

  const readPlanDetailState = (): PlanDetailState => {
    if (activePlansQuery.isPending) return PLAN_DETAIL_STATE.LOADING;
    if (activePlansQuery.isError) return PLAN_DETAIL_STATE.FAILED;
    return currentPlan ? PLAN_DETAIL_STATE.READY : PLAN_DETAIL_STATE.NOT_FOUND;
  };

  // Only limits the plan has are listed, each with its own label.
  const formatLimits = (planDetail: PlanDetail): FormattedPlanLimit[] => {
    const { maxBookings, maxCollaborators } = planDetail.limits;
    const formattedLimits: FormattedPlanLimit[] = [];
    if (maxBookings !== undefined) {
      formattedLimits.push({
        label: t("planCheckout.detail.limits.maxBookings", {
          count: maxBookings,
        }),
        limitName: PLAN_LIMIT_NAME.MAX_BOOKINGS,
      });
    }
    if (maxCollaborators !== undefined) {
      formattedLimits.push({
        label: t("planCheckout.detail.limits.maxCollaborators", {
          count: maxCollaborators,
        }),
        limitName: PLAN_LIMIT_NAME.MAX_COLLABORATORS,
      });
    }
    return formattedLimits;
  };

  // The price follows the active language without changing its amount
  // (AC-KAN-21-08).
  const formatPlan = (planDetail: PlanDetail): FormattedPlanDetail => ({
    billingPeriodLabel:
      planDetail.billingPeriod === PLAN_BILLING_PERIOD.ANNUAL
        ? t("planCheckout.detail.billingPeriod.annual")
        : t("planCheckout.detail.billingPeriod.monthly"),
    features: planDetail.features,
    formattedPrice: formatPrice(
      planDetail.priceInCents,
      PLAN_DETAIL_CURRENCY,
      i18n.language,
    ),
    id: planDetail.id,
    limits: formatLimits(planDetail),
    name: planDetail.name,
  });

  const plan: Nullable<FormattedPlanDetail> = currentPlan
    ? formatPlan(currentPlan)
    : null;

  // A signed-in user is asked to sign out first (AC-KAN-21-11, AS-8). The
  // plan is read again before the checkout opens (AC-KAN-21-10).
  const handleContract = (): void => {
    if (isSignedIn) {
      setHasTriedToContractSignedIn(true);
      return;
    }
    setContractError(null);
    verifyPlanIsActiveMutation.mutate(planId, {
      onError: (mutationError) => {
        setContractError({
          message: t(`common:${mutationError.messageKey}`),
          showCatalogLink: false,
        });
      },
      onSuccess: (isPlanActive) => {
        if (!isPlanActive) {
          setContractError({
            message: t("planCheckout.payment.planUnavailableError"),
            showCatalogLink: true,
          });
          return;
        }
        void navigate(
          generatePath(ROUTE_PATH.LANDING.PLAN_CHECKOUT, { planId }),
        );
      },
    });
  };

  return {
    contractError,
    failedMessageKey:
      activePlansQuery.error?.messageKey ?? ERROR_MESSAGE_KEY.UNKNOWN,
    handleContract,
    handleSignOut: (): void => {
      signOutMutation.mutate();
    },
    isCheckingPlan: verifyPlanIsActiveMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    plan,
    planDetailState: readPlanDetailState(),
    planSwitcherOptions: activePlans.map((activePlan) => ({
      isCurrent: activePlan.id === planId,
      name: activePlan.name,
      path: generatePath(ROUTE_PATH.LANDING.PLAN_DETAIL, {
        planId: activePlan.id,
      }),
    })),
    retry: (): void => {
      void activePlansQuery.refetch();
    },
    showSignedInNotice: hasTriedToContractSignedIn && isSignedIn,
  };
};
