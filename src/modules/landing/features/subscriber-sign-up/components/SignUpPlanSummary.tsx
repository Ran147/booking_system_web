import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { SignUpPlanSummary as SignUpPlanSummaryModel } from "../models/SubscriberSignUpPageViewModel.interface";

export interface SignUpPlanSummaryProps {
  readonly planSummary: SignUpPlanSummaryModel;
}

// The plan the visitor paid for (AC-KAN-25-14).
export const SignUpPlanSummary = ({
  planSummary,
}: SignUpPlanSummaryProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <section className="rounded-lg border border-border bg-muted/40 p-4">
      <h2 className="text-sm text-muted-foreground">
        {t("subscriberSignUp.plan.title")}
      </h2>
      <p className="flex flex-wrap items-baseline gap-2 pt-1">
        <span className="text-lg font-semibold text-foreground">
          {planSummary.planName}
        </span>
        <span className="text-foreground">{planSummary.formattedPrice}</span>
        <span className="text-sm text-muted-foreground">
          {planSummary.billingPeriodLabel}
        </span>
      </p>
    </section>
  );
};
