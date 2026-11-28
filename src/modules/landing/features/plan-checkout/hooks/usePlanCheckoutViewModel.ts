import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { generatePath, useNavigate, useParams } from "react-router";
import {
  FIREBASE_ERROR_CODE,
  I18N_NAMESPACE,
  ROUTE_PATH,
  STRING,
} from "@/constants";
import { recaptchaSiteKey } from "@/services/firebase";
import type { Nullable, NullableUndefined } from "@/types";
import { formatPrice, isValidationMessageKey } from "@/utils";
import { useActivePlanDetailsQuery } from "../api/useActivePlanDetailsQuery";
import { usePayPlanCheckoutMutation } from "../api/usePayPlanCheckoutMutation";
import { PLAN_CHECKOUT_ERROR_REASON } from "../constants/PlanCheckout.constants";
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
import type { PlanCheckoutFunctionError } from "../models/PlanCheckoutFunctionError.interface";
import type {
  PlanCheckoutFieldErrors,
  PlanCheckoutViewModel,
} from "../models/PlanCheckoutViewModel.interface";
import type { ContractError } from "../models/PlanDetailViewModel.interface";
import { buildPayPlanCheckoutPayload } from "../utils/buildPayPlanCheckoutPayload";
import { isPlanCheckoutMessageKey } from "../utils/isPlanCheckoutMessageKey";

// Emptied after a declined payment; the email and the terms stay
// (AC-KAN-22-04).
const PAYMENT_FIELDS = [
  "cardCvc",
  "cardExpiry",
  "cardNumber",
  "cardholderName",
] as const;

export const usePlanCheckoutViewModel = (): PlanCheckoutViewModel => {
  const { i18n, t } = useTranslation([
    I18N_NAMESPACE.LANDING,
    I18N_NAMESPACE.VALIDATION,
    I18N_NAMESPACE.COMMON,
  ]);
  const navigate = useNavigate();
  const { planId = STRING.EMPTY } = useParams();
  const activePlansQuery = useActivePlanDetailsQuery();
  const payPlanCheckoutMutation = usePayPlanCheckoutMutation();
  // Kept for every retry, so the same attempt is never charged twice
  // (AC-KAN-22-09, spec D1).
  const [attemptId] = useState<string>(() => crypto.randomUUID());
  const [confirmedEmail, setConfirmedEmail] = useState<string>(STRING.EMPTY);
  const [submitError, setSubmitError] = useState<Nullable<ContractError>>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<Nullable<string>>(null);
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0);
  // The new price after priceChanged: paying again confirms it (spec D2).
  const [changedPriceInCents, setChangedPriceInCents] =
    useState<Nullable<number>>(null);

  const currentPlan =
    activePlansQuery.data?.find((plan) => plan.id === planId) ?? null;
  const expectedPriceInCents =
    changedPriceInCents ?? currentPlan?.priceInCents ?? 0;

  const form = useForm<PlanCheckoutFormValues>({
    defaultValues: {
      cardCvc: STRING.EMPTY,
      cardExpiry: STRING.EMPTY,
      cardNumber: STRING.EMPTY,
      cardholderName: STRING.EMPTY,
      email: STRING.EMPTY,
      termsAccepted: false,
    },
    mode: "onTouched",
    resolver: zodResolver(checkoutSchema),
  });

  const formatPlanPrice = (priceInCents: number): string =>
    formatPrice(priceInCents, PLAN_DETAIL_CURRENCY, i18n.language);

  const showError = (message: string, showCatalogLink = false): void => {
    setSubmitError({ message, showCatalogLink });
  };

  // Each server answer as the spec §3.3 table says.
  const handlePaymentError = (
    planCheckoutFunctionError: PlanCheckoutFunctionError,
  ): void => {
    // The server already used the token: every retry needs a new one.
    setRecaptchaToken(null);
    setRecaptchaResetSignal((previousSignal) => previousSignal + 1);
    const { currentPriceInCents, reason } = planCheckoutFunctionError;
    if (reason === PLAN_CHECKOUT_ERROR_REASON.PAYMENT_DECLINED) {
      PAYMENT_FIELDS.forEach((paymentField) => form.resetField(paymentField));
      showError(t("planCheckout.checkout.declinedError"));
      return;
    }
    if (reason === PLAN_CHECKOUT_ERROR_REASON.PLAN_UNAVAILABLE) {
      showError(t("planCheckout.payment.planUnavailableError"), true);
      return;
    }
    if (
      reason === PLAN_CHECKOUT_ERROR_REASON.PRICE_CHANGED &&
      typeof currentPriceInCents === "number"
    ) {
      setChangedPriceInCents(currentPriceInCents);
      showError(
        t("planCheckout.payment.priceChangedError", {
          price: formatPlanPrice(currentPriceInCents),
        }),
      );
      return;
    }
    if (reason === PLAN_CHECKOUT_ERROR_REASON.ATTEMPT_REUSED) {
      showError(t("planCheckout.payment.attemptReusedError"));
      return;
    }
    if (
      planCheckoutFunctionError.code ===
      FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED
    ) {
      showError(t("validation:recaptchaRequired"));
      return;
    }
    showError(t(`common:${planCheckoutFunctionError.messageKey}`));
  };

  const handleSubmit = form.handleSubmit((formValues): void => {
    if (!recaptchaToken || !currentPlan) return;
    setSubmitError(null);
    payPlanCheckoutMutation.mutate(
      buildPayPlanCheckoutPayload(formValues, {
        activeLanguage: i18n.language,
        attemptId,
        expectedPriceInCents,
        planId: currentPlan.id,
        recaptchaToken,
      }),
      {
        onError: handlePaymentError,
        onSuccess: (payPlanCheckoutResponse) => {
          setConfirmedEmail(payPlanCheckoutResponse.email);
        },
      },
    );
  });

  const translateFieldError = (
    fieldError: NullableUndefined<FieldError>,
  ): NullableUndefined<string> => {
    const messageKey = fieldError?.message;
    if (!messageKey) return undefined;
    if (isValidationMessageKey(messageKey)) {
      return t(`validation:${messageKey}`);
    }
    return isPlanCheckoutMessageKey(messageKey) ? t(messageKey) : undefined;
  };

  const { errors } = form.formState;
  const fieldErrors: PlanCheckoutFieldErrors = {
    cardCvc: translateFieldError(errors.cardCvc),
    cardExpiry: translateFieldError(errors.cardExpiry),
    cardNumber: translateFieldError(errors.cardNumber),
    cardholderName: translateFieldError(errors.cardholderName),
    email: translateFieldError(errors.email),
    termsAccepted: translateFieldError(errors.termsAccepted),
  };

  const readCheckoutState = (): PlanCheckoutState => {
    if (!activePlansQuery.isPending && !currentPlan) {
      return PLAN_CHECKOUT_STATE.NOT_FOUND;
    }
    if (confirmedEmail) return PLAN_CHECKOUT_STATE.SUCCESS;
    return payPlanCheckoutMutation.isPending
      ? PLAN_CHECKOUT_STATE.PROCESSING
      : PLAN_CHECKOUT_STATE.READY;
  };

  return {
    billingPeriodLabel:
      currentPlan?.billingPeriod === PLAN_BILLING_PERIOD.ANNUAL
        ? t("planCheckout.detail.billingPeriod.annual")
        : t("planCheckout.detail.billingPeriod.monthly"),
    checkoutState: readCheckoutState(),
    confirmedEmail,
    fieldErrors,
    fields: {
      cardCvc: form.register("cardCvc"),
      cardExpiry: form.register("cardExpiry"),
      cardNumber: form.register("cardNumber"),
      cardholderName: form.register("cardholderName"),
      email: form.register("email"),
      termsAccepted: form.register("termsAccepted"),
    },
    formattedPrice: currentPlan
      ? formatPlanPrice(expectedPriceInCents)
      : STRING.EMPTY,
    handleBackToDetail: (): void => {
      void navigate(generatePath(ROUTE_PATH.LANDING.PLAN_DETAIL, { planId }));
    },
    handleSubmit,
    isPayDisabled: !recaptchaToken,
    isPlanLoading: activePlansQuery.isPending,
    plan: currentPlan,
    recaptcha: {
      language: i18n.language,
      onTokenChange: setRecaptchaToken,
      resetSignal: recaptchaResetSignal,
      siteKey: recaptchaSiteKey,
    },
    submitError,
  };
};
