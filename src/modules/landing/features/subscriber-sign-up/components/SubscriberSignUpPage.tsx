import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, ErrorState, Spinner } from "@/shared/components";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/shared/constants";
import { SignUpLinkNotice } from "./SignUpLinkNotice";
import { SignUpPlanSummary } from "./SignUpPlanSummary";
import { SubscriberSignUpForm } from "./SubscriberSignUpForm";
import { SIGN_UP_LINK_STATE } from "../constants/SubscriberSignUpForm.constants";
import { useSubscriberSignUpPageViewModel } from "../hooks/useSubscriberSignUpPageViewModel";

// /sign-up?token=<token>, opened from the KAN-24 payment email (KAN-25).
export const SubscriberSignUpPage = (): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.LANDING, I18N_NAMESPACE.COMMON]);
  const {
    checkoutEmail,
    failedMessageKey,
    handleSignUpComplete,
    linkState,
    planSummary,
    retryLinkCheck,
    signUpToken,
  } = useSubscriberSignUpPageViewModel();

  const renderContent = (): ReactElement => {
    switch (linkState) {
      case SIGN_UP_LINK_STATE.CHECKING:
        return <Spinner />;
      case SIGN_UP_LINK_STATE.MISSING:
        return (
          <SignUpLinkNotice
            actionLabel={t("landing:subscriberSignUp.link.plansAction")}
            actionPath={ROUTE_PATH.LANDING.PLANS}
            message={t("landing:subscriberSignUp.link.missing")}
          />
        );
      case SIGN_UP_LINK_STATE.INVALID:
        return (
          <SignUpLinkNotice
            actionLabel={t("landing:subscriberSignUp.link.plansAction")}
            actionPath={ROUTE_PATH.LANDING.PLANS}
            message={t("landing:subscriberSignUp.link.invalid")}
          />
        );
      case SIGN_UP_LINK_STATE.EXPIRED:
        return (
          <SignUpLinkNotice
            actionLabel={t("landing:subscriberSignUp.link.contactAction")}
            actionPath={ROUTE_PATH.LANDING.CONTACT}
            message={t("landing:subscriberSignUp.link.expired")}
          />
        );
      case SIGN_UP_LINK_STATE.FAILED:
        return (
          <div className="flex flex-col items-center gap-4">
            <ErrorState messageKey={failedMessageKey} />
            <Button onClick={retryLinkCheck} variant="outline">
              {t("landing:subscriberSignUp.link.retryAction")}
            </Button>
          </div>
        );
      case SIGN_UP_LINK_STATE.READY:
        return (
          <div className="flex flex-col gap-6">
            {planSummary ? (
              <SignUpPlanSummary planSummary={planSummary} />
            ) : null}
            <SubscriberSignUpForm
              checkoutEmail={checkoutEmail}
              onSignUpComplete={handleSignUpComplete}
              signUpToken={signUpToken}
            />
          </div>
        );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          {t("landing:subscriberSignUp.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("landing:subscriberSignUp.description")}
        </p>
      </header>
      {renderContent()}
    </div>
  );
};
