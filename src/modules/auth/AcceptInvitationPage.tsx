import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { AcceptInvitationForm } from "./components/AcceptInvitationForm";
import { AcceptInvitationLinkNotice } from "./components/AcceptInvitationLinkNotice";
import { ACCEPT_INVITATION_LINK_STATE } from "./constants/AcceptInvitation.constants";
import { useAcceptInvitationViewModel } from "./hooks/useAcceptInvitationViewModel";

// Landing screen for collaborator email invitations (KAN-79).
export const AcceptInvitationPage = (): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.VALIDATION,
  ]);
  const acceptInvitationViewModel = useAcceptInvitationViewModel();
  const {
    linkState,
    retryLinkCheck,
    serverErrorAlertReference,
    serverErrorKey,
  } = acceptInvitationViewModel;

  const renderContent = (): ReactElement => {
    if (linkState === ACCEPT_INVITATION_LINK_STATE.CHECKING) {
      return <Spinner label={t("auth.invitation.validating")} />;
    }
    if (linkState === ACCEPT_INVITATION_LINK_STATE.VALID) {
      return (
        <>
          {serverErrorKey && (
            <Alert ref={serverErrorAlertReference}>{t(serverErrorKey)}</Alert>
          )}
          <AcceptInvitationForm
            acceptInvitationViewModel={acceptInvitationViewModel}
          />
        </>
      );
    }
    return (
      <AcceptInvitationLinkNotice
        onRetry={retryLinkCheck}
        shouldOfferRetry={
          linkState === ACCEPT_INVITATION_LINK_STATE.NETWORK_ERROR
        }
      />
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
