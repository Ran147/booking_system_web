import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { generatePath, useNavigate, useParams } from "react-router";
import { I18N_NAMESPACE, ROUTE_PATH, STRING } from "@/constants";
import type { Nullable } from "@/types";
import { formatPrice } from "@/utils/format";
import { useActivePlanDetailsQuery } from "../api/useActivePlanDetailsQuery";
import { CHECKOUT_SIMULATION } from "../constants/PlanCheckout.constants";
import {
  PLAN_BILLING_PERIOD,
  PLAN_DETAIL_CURRENCY,
} from "../constants/PlanDetail.constants";
import {
  checkoutSchema,
  PLAN_CHECKOUT_STATE,
  type PlanCheckoutFormValues,
  type PlanCheckoutState,
} from "../models/PlanCheckout.model";
import type { PlanDetail } from "../models/PlanDetail.interface";

export interface PlanCheckoutFieldErrors {
  readonly cardCvc?: string;
  readonly cardExpiry?: string;
  readonly cardNumber?: string;
  readonly cardholderName?: string;
  readonly email?: string;
  readonly termsAccepted?: string;
}

export interface PlanCheckoutFields {
  readonly cardCvc: UseFormRegisterReturn;
  readonly cardExpiry: UseFormRegisterReturn;
  readonly cardNumber: UseFormRegisterReturn;
  readonly cardholderName: UseFormRegisterReturn;
  readonly email: UseFormRegisterReturn;
  readonly termsAccepted: UseFormRegisterReturn;
}

export interface PlanCheckoutViewModel {
  readonly billingPeriodLabel: string;
  readonly checkoutState: PlanCheckoutState;
  readonly confirmedEmail: string;
  readonly errorMessage: Nullable<string>;
  readonly fieldErrors: PlanCheckoutFieldErrors;
  readonly fields: PlanCheckoutFields;
  readonly formattedPrice: string;
  readonly handleBackToDetail: () => void;
  readonly handleProceedToSignUp: () => void;
  readonly handleSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  readonly isPlanLoading: boolean;
  readonly plan: Nullable<PlanDetail>;
}

export const usePlanCheckoutViewModel = (): PlanCheckoutViewModel => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.LANDING);
  const navigate = useNavigate();
  const { planId = STRING.EMPTY } = useParams();
  const activePlansQuery = useActivePlanDetailsQuery();
  const [checkoutState, setCheckoutState] = useState<PlanCheckoutState>(
    PLAN_CHECKOUT_STATE.READY,
  );
  const [errorMessage, setErrorMessage] = useState<Nullable<string>>(null);
  const [confirmedEmail, setConfirmedEmail] = useState<string>(STRING.EMPTY);

  const activePlans = activePlansQuery.data ?? [];
  const currentPlan = activePlans.find((plan) => plan.id === planId) ?? null;

  const form = useForm<PlanCheckoutFormValues>({
    defaultValues: {
      cardCvc: "",
      cardExpiry: "",
      cardNumber: "",
      cardholderName: "",
      email: "",
      termsAccepted: false,
    },
    mode: "onTouched",
    resolver: zodResolver(checkoutSchema),
  });

  const formattedPrice = currentPlan
    ? formatPrice(currentPlan.priceInCents, PLAN_DETAIL_CURRENCY, i18n.language)
    : "";

  const billingPeriodLabel =
    currentPlan?.billingPeriod === PLAN_BILLING_PERIOD.ANNUAL
      ? t("planCheckout.detail.billingPeriod.annual")
      : t("planCheckout.detail.billingPeriod.monthly");

  const handleBackToDetail = (): void => {
    void navigate(generatePath(ROUTE_PATH.LANDING.PLAN_DETAIL, { planId }));
  };

  const handleSubmit = form.handleSubmit((values): void => {
    setErrorMessage(null);
    setCheckoutState(PLAN_CHECKOUT_STATE.PROCESSING);

    // Simulate gateway behavior (Q5, KAN-22)
    const normalizedCard = values.cardNumber.replace(/\s+/g, "");

    setTimeout(() => {
      if (
        normalizedCard === CHECKOUT_SIMULATION.DECLINED_CARD_NUMBER ||
        normalizedCard.endsWith(CHECKOUT_SIMULATION.DECLINED_CARD_SUFFIX)
      ) {
        setCheckoutState(PLAN_CHECKOUT_STATE.DECLINED);
        setErrorMessage(t("planCheckout.checkout.declinedError"));
        return;
      }

      setConfirmedEmail(values.email);
      setCheckoutState(PLAN_CHECKOUT_STATE.SUCCESS);
    }, CHECKOUT_SIMULATION.PROCESSING_DELAY_MS);
  });

  const handleProceedToSignUp = (): void => {
    const token = confirmedEmail
      ? encodeURIComponent(confirmedEmail)
      : "seed-token-valid";
    void navigate(`${ROUTE_PATH.LANDING.SIGN_UP}?token=${token}`);
  };

  const isPlanLoading = activePlansQuery.isPending;
  const isPlanNotFound = !isPlanLoading && !currentPlan;

  const { errors } = form.formState;

  const fieldErrors: PlanCheckoutFieldErrors = {
    cardCvc: errors.cardCvc?.message,
    cardExpiry: errors.cardExpiry?.message,
    cardNumber: errors.cardNumber?.message,
    cardholderName: errors.cardholderName?.message,
    email: errors.email?.message,
    termsAccepted: errors.termsAccepted
      ? t("planCheckout.checkout.termsRequired")
      : undefined,
  };

  const fields: PlanCheckoutFields = {
    cardCvc: form.register("cardCvc"),
    cardExpiry: form.register("cardExpiry"),
    cardNumber: form.register("cardNumber"),
    cardholderName: form.register("cardholderName"),
    email: form.register("email"),
    termsAccepted: form.register("termsAccepted"),
  };

  return {
    billingPeriodLabel,
    checkoutState: isPlanNotFound
      ? PLAN_CHECKOUT_STATE.NOT_FOUND
      : checkoutState,
    confirmedEmail,
    errorMessage,
    fieldErrors,
    fields,
    formattedPrice,
    handleBackToDetail,
    handleProceedToSignUp,
    handleSubmit,
    isPlanLoading,
    plan: currentPlan,
  };
};
