import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink, ErrorState, Spinner } from "@/components/common";
import { ERROR_MESSAGE_KEY, I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import { PlanCheckoutForm } from "./PlanCheckoutForm";
import { PlanCheckoutSuccess } from "./PlanCheckoutSuccess";
import { usePlanCheckoutViewModel } from "../hooks/usePlanCheckoutViewModel";
import { PLAN_CHECKOUT_STATE } from "../models/PlanCheckout.model";

export const PlanCheckoutPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const {
    billingPeriodLabel,
    checkoutState,
    confirmedEmail,
    errorMessage,
    fieldErrors,
    fields,
    formattedPrice,
    handleBackToDetail,
    handleProceedToSignUp,
    handleSubmit,
    isPlanLoading,
    plan,
  } = usePlanCheckoutViewModel();

  if (isPlanLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!plan || checkoutState === PLAN_CHECKOUT_STATE.NOT_FOUND) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-16">
        <ErrorState messageKey={ERROR_MESSAGE_KEY.NOT_FOUND} />
        <AppLink to={ROUTE_PATH.LANDING.HOME}>
          {t("planCheckout.detail.backToPlans")}
        </AppLink>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <AppLink className="self-start text-sm" to={ROUTE_PATH.LANDING.HOME}>
        {t("planCheckout.detail.backToPlans")}
      </AppLink>

      {checkoutState === PLAN_CHECKOUT_STATE.SUCCESS ? (
        <PlanCheckoutSuccess
          confirmedEmail={confirmedEmail}
          formattedPrice={formattedPrice}
          onProceedToSignUp={handleProceedToSignUp}
          plan={plan}
        />
      ) : (
        <PlanCheckoutForm
          billingPeriodLabel={billingPeriodLabel}
          checkoutState={checkoutState}
          errorMessage={errorMessage}
          fieldErrors={fieldErrors}
          fields={fields}
          formattedPrice={formattedPrice}
          onBackToDetail={handleBackToDetail}
          onSubmit={handleSubmit}
          plan={plan}
        />
      )}
    </div>
  );
};
