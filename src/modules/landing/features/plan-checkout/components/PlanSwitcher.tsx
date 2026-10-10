import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { cn } from "@/shared/utils/cn";
import type { PlanSwitcherOption } from "../models/PlanDetailViewModel.interface";

export interface PlanSwitcherProps {
  readonly planSwitcherOptions: readonly PlanSwitcherOption[];
}

// Moves between the active plans without going back to the catalog; the
// current plan is marked (AC-KAN-21-03, AS-4).
export const PlanSwitcher = ({
  planSwitcherOptions,
}: PlanSwitcherProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <nav aria-label={t("planCheckout.detail.otherPlans")}>
      <ul className="flex flex-wrap gap-2">
        {planSwitcherOptions.map((planSwitcherOption) => (
          <li key={planSwitcherOption.path}>
            <AppLink
              aria-current={planSwitcherOption.isCurrent ? "page" : undefined}
              className={cn(
                "inline-block rounded-full border px-4 py-1.5 text-sm no-underline hover:no-underline",
                planSwitcherOption.isCurrent
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-muted",
              )}
              to={planSwitcherOption.path}
            >
              {planSwitcherOption.name}
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
