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
import { PasswordResetForm } from "./components/PasswordResetForm";
import { PasswordResetLinkNotice } from "./components/PasswordResetLinkNotice";
import { PASSWORD_RESET_LINK_STATE } from "./constants/PasswordResetLink.constants";
import { usePasswordResetViewModel } from "./hooks/usePasswordResetViewModel";

// Where the link of the reset email lands, for every role (KAN-37, KAN-132).
export const PasswordResetPage = (): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.VALIDATION,
  ]);
  const passwordResetViewModel = usePasswordResetViewModel();
  const {
    linkState,
    retryLinkCheck,
    serverErrorAlertReference,
    serverErrorKey,
  } = passwordResetViewModel;

  const renderContent = (): ReactElement => {
    if (linkState === PASSWORD_RESET_LINK_STATE.CHECKING) return <Spinner />;
    if (linkState === PASSWORD_RESET_LINK_STATE.VALID) {
      return (
        <>
          {serverErrorKey && (
            <Alert ref={serverErrorAlertReference}>{t(serverErrorKey)}</Alert>
          )}
          <PasswordResetForm passwordResetViewModel={passwordResetViewModel} />
        </>
      );
    }
    return (
      <PasswordResetLinkNotice
        onRetry={retryLinkCheck}
        shouldOfferRetry={linkState === PASSWORD_RESET_LINK_STATE.NETWORK_ERROR}
      />
    );
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("auth.passwordReset.title")}
          </h1>
          <CardDescription>{t("auth.passwordReset.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {renderContent()}
        </CardContent>
      </Card>
    </main>
  );
};
