import { Check } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { FormattedPlanCard } from "../models/PlanCatalogViewModel.interface";

export interface PlanCardProps {
  readonly onSelectPlan: (planId: string) => void;
  readonly plan: FormattedPlanCard;
}

export const PlanCard = ({
  onSelectPlan,
  plan,
}: PlanCardProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <Card className="flex h-full flex-col justify-between border-border transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="flex items-baseline gap-1 pt-2">
          <span className="text-3xl font-extrabold text-foreground">
            {plan.formattedPrice}
          </span>
          <span className="text-sm text-muted-foreground">
            {plan.billingPeriodLabel}
          </span>
        </CardDescription>
        <p className="pt-1 text-xs text-muted-foreground">
          {plan.maxBookingsLabel}
        </p>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {plan.features.map((featureItem, featureIndex) => (
            <li
              className="flex items-center gap-2"
              key={`${plan.id}-feature-${featureIndex}`}
            >
              <Check
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-primary"
              />
              <span>{featureItem}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={(): void => onSelectPlan(plan.id)}
          variant="default"
        >
          {t("home.plans.seeDetails")}
        </Button>
      </CardFooter>
    </Card>
  );
};
