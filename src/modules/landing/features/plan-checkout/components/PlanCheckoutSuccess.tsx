import { CheckCircle2 } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  BADGE_VARIANT,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { PlanDetail } from "../models/PlanDetail.interface";

export interface PlanCheckoutSuccessProps {
  readonly confirmedEmail: string;
  readonly formattedPrice: string;
  readonly onProceedToSignUp: () => void;
  readonly plan: PlanDetail;
}

export const PlanCheckoutSuccess = ({
  confirmedEmail,
  formattedPrice,
  onProceedToSignUp,
  plan,
}: PlanCheckoutSuccessProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <Card className="mx-auto max-w-xl text-center shadow-lg border-primary/20">
      <CardHeader className="flex flex-col items-center gap-3 pt-8 pb-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-10" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">
          {t("planCheckout.checkout.successTitle")}
        </CardTitle>
        <p className="text-sm text-muted-foreground px-4">
          {t("planCheckout.checkout.successDescription", {
            planName: plan.name,
          })}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-8 pb-6">
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-left space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {t("planCheckout.checkout.selectedPlanLabel")}
            </span>
            <span className="font-semibold text-foreground">{plan.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {t("planCheckout.checkout.paidAmountLabel")}
            </span>
            <span className="font-semibold text-foreground">
              {formattedPrice}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {t("planCheckout.checkout.contactEmailLabel")}
            </span>
            <span className="font-medium text-foreground">
              {confirmedEmail}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">
              {t("planCheckout.checkout.transactionStatusLabel")}
            </span>
            <Badge variant={BADGE_VARIANT.SUCCESS}>
              {t("planCheckout.checkout.statusApproved")}
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-8 pb-8 pt-0">
        <Button fullWidth onClick={onProceedToSignUp} size="lg">
          {t("planCheckout.checkout.successAction")}
        </Button>
      </CardFooter>
    </Card>
  );
};
