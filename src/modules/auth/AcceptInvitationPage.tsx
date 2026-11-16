import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  AppLink,
  Button,
  BUTTON_VARIANT,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import { AcceptInvitationForm } from "./components/AcceptInvitationForm";
import { INVITATION_LINK_STATE } from "./constants/InvitationLink.constants";
import { useAcceptInvitationViewModel } from "./hooks/useAcceptInvitationViewModel";

export const AcceptInvitationPage = (): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.VALIDATION,
  ]);
  const viewModel = useAcceptInvitationViewModel();
  const {
    businessName,
    email,
    linkState,
    retryLinkCheck,
    serverErrorAlertReference,
    serverErrorKey,
  } = viewModel;

  const renderContent = (): ReactElement => {
    if (linkState === INVITATION_LINK_STATE.CHECKING) {
      return (
        <div className="flex items-center justify-center gap-3 py-6 text-sm text-muted-foreground">
          <Spinner />
          <span>{t("auth.invitation.validating")}</span>
        </div>
      );
    }
    if (linkState === INVITATION_LINK_STATE.VALID) {
      return (
        <>
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
            {t("auth.invitation.businessContext", { businessName, email })}
          </p>
          {serverErrorKey && (
            <Alert
              ref={serverErrorAlertReference}
              variant={ALERT_VARIANT.DESTRUCTIVE}
            >
              {t(serverErrorKey)}
            </Alert>
          )}
          <AcceptInvitationForm viewModel={viewModel} />
        </>
      );
    }

    const isNetworkError = linkState === INVITATION_LINK_STATE.NETWORK_ERROR;
    return (
      <div className="flex flex-col gap-4">
        <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>
          {isNetworkError
            ? t("errors.network")
            : t("auth.invitation.linkInvalid")}
        </Alert>
        {isNetworkError ? (
          <Button
            onClick={retryLinkCheck}
            type="button"
            variant={BUTTON_VARIANT.SECONDARY}
          >
            {t("auth.passwordReset.retryAction")}
          </Button>
        ) : (
          <AppLink to={ROUTE_PATH.AUTH.SIGN_IN}>
            {t("auth.invitation.signInAction")}
          </AppLink>
        )}
      </div>
    );
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("auth.invitation.title")}
          </h1>
          <CardDescription>{t("auth.invitation.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {renderContent()}
        </CardContent>
      </Card>
    </main>
  );
};
