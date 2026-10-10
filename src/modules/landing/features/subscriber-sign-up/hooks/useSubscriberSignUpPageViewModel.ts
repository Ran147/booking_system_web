import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import {
  ERROR_MESSAGE_KEY,
  I18N_NAMESPACE,
  ROUTE_PATH,
  STRING,
} from "@/shared/constants";
import type { Nullable } from "@/shared/types";
import { formatPrice } from "@/shared/utils/format";
import { useSignUpLinkQuery } from "../api/useSignUpLinkQuery";
import {
  SIGN_UP_LINK_STATE,
  type SignUpLinkState,
} from "../constants/SubscriberSignUpForm.constants";
import {
  SIGN_UP_BILLING_PERIOD,
  SIGN_UP_ERROR_REASON,
  SIGN_UP_PLAN_CURRENCY,
  SIGN_UP_TOKEN_SEARCH_PARAM,
} from "../constants/SubscriberSignUpServer.constants";
import type { SignUpCompletedLocationState } from "../models/SignUpCompletedLocationState.interface";
import type {
  SignUpPlanSummary,
  SubscriberSignUpPageViewModel,
} from "../models/SubscriberSignUpPageViewModel.interface";

export const useSubscriberSignUpPageViewModel =
  (): SubscriberSignUpPageViewModel => {
    const { i18n, t } = useTranslation(I18N_NAMESPACE.LANDING);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const signUpToken =
      searchParams.get(SIGN_UP_TOKEN_SEARCH_PARAM)?.trim() ?? STRING.EMPTY;
    const signUpLinkQuery = useSignUpLinkQuery(signUpToken);
    const signUpLink = signUpLinkQuery.data;

    // No token: sign-up starts by choosing a plan (AC-KAN-25-21). A rejected
    // link shows no form (AC-KAN-25-20).
    const readLinkState = (): SignUpLinkState => {
      if (!signUpToken) return SIGN_UP_LINK_STATE.MISSING;
      if (signUpLink) return SIGN_UP_LINK_STATE.READY;
      if (signUpLinkQuery.isPending) return SIGN_UP_LINK_STATE.CHECKING;
      switch (signUpLinkQuery.error?.reason) {
        case SIGN_UP_ERROR_REASON.LINK_EXPIRED:
          return SIGN_UP_LINK_STATE.EXPIRED;
        case SIGN_UP_ERROR_REASON.LINK_INVALID:
          return SIGN_UP_LINK_STATE.INVALID;
        default:
          return SIGN_UP_LINK_STATE.FAILED;
      }
    };

    const planSummary: Nullable<SignUpPlanSummary> = signUpLink
      ? {
          billingPeriodLabel:
            signUpLink.billingPeriod === SIGN_UP_BILLING_PERIOD.ANNUAL
              ? t("subscriberSignUp.plan.billingPeriod.annual")
              : t("subscriberSignUp.plan.billingPeriod.monthly"),
          formattedPrice: formatPrice(
            signUpLink.amountInCents,
            SIGN_UP_PLAN_CURRENCY,
            i18n.language,
          ),
          planName: signUpLink.planName,
        }
      : null;

    // replace: the back button does not return to a used link (AC-KAN-27-05).
    const handleSignUpComplete = (email: string): void => {
      const signUpCompletedState: SignUpCompletedLocationState = {
        signUpEmail: email,
      };
      void navigate(ROUTE_PATH.AUTH.SIGN_IN, {
        replace: true,
        state: signUpCompletedState,
      });
    };

    return {
      checkoutEmail: signUpLink?.checkoutEmail ?? STRING.EMPTY,
      failedMessageKey:
        signUpLinkQuery.error?.messageKey ?? ERROR_MESSAGE_KEY.UNKNOWN,
      handleSignUpComplete,
      linkState: readLinkState(),
      planSummary,
      retryLinkCheck: (): void => {
        void signUpLinkQuery.refetch();
      },
      signUpToken,
    };
  };
