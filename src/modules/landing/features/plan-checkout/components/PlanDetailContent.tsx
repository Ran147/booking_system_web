import { Check } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { SignedInContractNotice } from "./SignedInContractNotice";
import type { FormattedPlanDetail } from "../models/PlanDetailViewModel.interface";

export interface PlanDetailContentProps {
  readonly isSigningOut: boolean;
  readonly onContract: () => void;
  readonly onSignOut: () => void;
  readonly plan: FormattedPlanDetail;
  readonly showSignedInNotice: boolean;
}

// Name, price, features and limits of one plan, and the contract action
// (AC-KAN-21-01, AC-KAN-21-09).
export const PlanDetailContent = ({
  isSigningOut,
  onContract,
  onSignOut,
  plan,
  showSignedInNotice,
}: PlanDetailContentProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <article className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">{plan.name}</h1>
        <p className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-foreground">
            {plan.formattedPrice}
          </span>
          <span className="text-sm text-muted-foreground">
            {plan.billingPeriodLabel}
          </span>
        </p>
      </header>

      {plan.limits.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">
            {t("planCheckout.detail.limitsTitle")}
          </h2>
          <ul className="flex flex-col gap-1 text-sm text-foreground">
            {plan.limits.map((planLimit) => (
              <li key={planLimit.limitName}>{planLimit.label}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {plan.features.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">
            {t("planCheckout.detail.featuresTitle")}
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {plan.features.map((feature) => (
              <li className="flex items-center gap-2" key={feature}>
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary"
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showSignedInNotice ? (
        <SignedInContractNotice
          isSigningOut={isSigningOut}
          onSignOut={onSignOut}
        />
      ) : null}
      <Button fullWidth onClick={onContract}>
        {t("planCheckout.detail.contract")}
      </Button>
    </article>
  );
};
