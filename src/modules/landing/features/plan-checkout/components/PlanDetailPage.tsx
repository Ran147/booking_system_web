import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink, Button, ErrorState, Spinner } from "@/shared/components";
import {
  ERROR_MESSAGE_KEY,
  I18N_NAMESPACE,
  ROUTE_PATH,
} from "@/shared/constants";
import { PlanDetailContent } from "./PlanDetailContent";
import { PlanSwitcher } from "./PlanSwitcher";
import { PLAN_DETAIL_STATE } from "../constants/PlanDetail.constants";
import { usePlanDetailPageViewModel } from "../hooks/usePlanDetailPageViewModel";

// /plans/:planId, opened from the plan catalog or a shared link (KAN-21).
export const PlanDetailPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const {
    contractError,
    failedMessageKey,
    handleContract,
    handleSignOut,
    isCheckingPlan,
    isSigningOut,
    plan,
    planDetailState,
    planSwitcherOptions,
    retry,
    showSignedInNotice,
  } = usePlanDetailPageViewModel();

  const renderContent = (): ReactElement => {
    switch (planDetailState) {
      case PLAN_DETAIL_STATE.LOADING:
        return <Spinner />;
      case PLAN_DETAIL_STATE.FAILED:
        return (
          <div className="flex flex-col items-center gap-4">
            <ErrorState messageKey={failedMessageKey} />
            <Button onClick={retry} variant="outline">
              {t("planCheckout.detail.retryAction")}
            </Button>
          </div>
        );
      case PLAN_DETAIL_STATE.NOT_FOUND:
        return <ErrorState messageKey={ERROR_MESSAGE_KEY.NOT_FOUND} />;
      case PLAN_DETAIL_STATE.READY:
        return (
          <div className="flex flex-col gap-6">
            {planSwitcherOptions.length > 1 ? (
              <PlanSwitcher planSwitcherOptions={planSwitcherOptions} />
            ) : null}
            {plan ? (
              <PlanDetailContent
                contractError={contractError}
                isCheckingPlan={isCheckingPlan}
                isSigningOut={isSigningOut}
                onContract={handleContract}
                onSignOut={handleSignOut}
                plan={plan}
                showSignedInNotice={showSignedInNotice}
              />
            ) : null}
          </div>
        );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <AppLink className="self-start text-sm" to={ROUTE_PATH.LANDING.HOME}>
        {t("planCheckout.detail.backToPlans")}
      </AppLink>
      {renderContent()}
    </div>
  );
};
