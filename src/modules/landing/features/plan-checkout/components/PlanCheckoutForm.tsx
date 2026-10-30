import { Check, CreditCard, ShieldCheck } from "lucide-react";
import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  AppLink,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CheckboxField,
  InputField,
} from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import type { Nullable } from "@/types";
import type {
  PlanCheckoutFieldErrors,
  PlanCheckoutFields,
} from "../hooks/usePlanCheckoutViewModel";
import {
  PLAN_CHECKOUT_STATE,
  type PlanCheckoutState,
} from "../models/PlanCheckout.model";
import type { PlanDetail } from "../models/PlanDetail.interface";

export interface PlanCheckoutFormProps {
  readonly billingPeriodLabel: string;
  readonly checkoutState: PlanCheckoutState;
  readonly errorMessage: Nullable<string>;
  readonly fieldErrors: PlanCheckoutFieldErrors;
  readonly fields: PlanCheckoutFields;
  readonly formattedPrice: string;
  readonly onBackToDetail: () => void;
  readonly onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
  readonly plan: PlanDetail;
}

export const PlanCheckoutForm = ({
  billingPeriodLabel,
  checkoutState,
  errorMessage,
  fieldErrors,
  fields,
  formattedPrice,
  onBackToDetail,
  onSubmit,
  plan,
}: PlanCheckoutFormProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  const isProcessing = checkoutState === PLAN_CHECKOUT_STATE.PROCESSING;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Columna Izquierda: Formulario de Pago */}
      <div className="lg:col-span-7">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
              <ShieldCheck className="size-4" />
              <span>{t("planCheckout.checkout.stepTitle")}</span>
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              {t("planCheckout.checkout.title")}
            </CardTitle>
            <CardDescription>
              {t("planCheckout.checkout.subtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Aviso de Simulación */}
            <div className="mb-6 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
              <CreditCard className="size-4 shrink-0 text-primary mt-0.5" />
              <span>{t("planCheckout.checkout.simulationNotice")}</span>
            </div>

            {errorMessage ? (
              <div className="mb-6">
                <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>
                  {errorMessage}
                </Alert>
              </div>
            ) : null}

            <form
              className="flex flex-col gap-5"
              noValidate
              onSubmit={onSubmit}
            >
              {/* Email */}
              <InputField
                {...fields.email}
                autoComplete="email"
                error={fieldErrors.email}
                helperText={t("planCheckout.checkout.emailHint")}
                id="checkout-email"
                label={t("planCheckout.checkout.emailLabel")}
                required
                type="email"
              />

              {/* Titular de la tarjeta */}
              <InputField
                {...fields.cardholderName}
                autoComplete="cc-name"
                error={fieldErrors.cardholderName}
                helperText={t("planCheckout.checkout.cardholderNameHint")}
                id="checkout-cardholder"
                label={t("planCheckout.checkout.cardholderNameLabel")}
                required
              />

              {/* Número de tarjeta */}
              <InputField
                {...fields.cardNumber}
                autoComplete="cc-number"
                error={fieldErrors.cardNumber}
                helperText={t("planCheckout.checkout.cardNumberHint")}
                id="checkout-cardnumber"
                label={t("planCheckout.checkout.cardNumberLabel")}
                required
              />

              {/* Expiración y CVC */}
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  {...fields.cardExpiry}
                  autoComplete="cc-exp"
                  error={fieldErrors.cardExpiry}
                  helperText={t("planCheckout.checkout.cardExpiryHint")}
                  id="checkout-cardexpiry"
                  label={t("planCheckout.checkout.cardExpiryLabel")}
                  required
                />
                <InputField
                  {...fields.cardCvc}
                  autoComplete="cc-csc"
                  error={fieldErrors.cardCvc}
                  helperText={t("planCheckout.checkout.cardCvcHint")}
                  id="checkout-cardcvc"
                  label={t("planCheckout.checkout.cardCvcLabel")}
                  required
                />
              </div>

              {/* Términos y condiciones */}
              <div className="pt-2">
                <CheckboxField
                  {...fields.termsAccepted}
                  error={fieldErrors.termsAccepted}
                  id="checkout-terms"
                  label={
                    <span>
                      {t("planCheckout.checkout.termsAcceptance")}{" "}
                      <AppLink
                        className="font-medium underline hover:text-primary"
                        target="_blank"
                        to={ROUTE_PATH.LANDING.TERMS}
                      >
                        {t("planCheckout.checkout.termsLink")}
                      </AppLink>
                    </span>
                  }
                  required
                />
              </div>

              {/* Acciones */}
              <div className="flex flex-col gap-3 pt-3">
                <Button
                  fullWidth
                  isLoading={isProcessing}
                  size="lg"
                  type="submit"
                >
                  {isProcessing
                    ? t("planCheckout.checkout.paying")
                    : t("planCheckout.checkout.payAction")}
                </Button>

                <Button
                  disabled={isProcessing}
                  fullWidth
                  onClick={onBackToDetail}
                  type="button"
                  variant="ghost"
                >
                  {t("planCheckout.checkout.backToDetail")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha: Resumen de Compra */}
      <div className="lg:col-span-5">
        <Card className="sticky top-24 bg-card/60 backdrop-blur-sm shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-foreground">
              {t("planCheckout.checkout.planSummaryTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-background p-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-foreground text-lg">
                  {plan.name}
                </h3>
                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                  {t("planCheckout.checkout.subscriptionBadge")}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground">
                  {formattedPrice}
                </span>
                <span className="text-sm text-muted-foreground">
                  {billingPeriodLabel}
                </span>
              </div>
            </div>

            {plan.features.length > 0 ? (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("planCheckout.detail.featuresTitle")}
                </h4>
                <ul className="space-y-1.5 text-xs text-foreground">
                  {plan.features.map((feature) => (
                    <li className="flex items-start gap-2" key={feature}>
                      <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
