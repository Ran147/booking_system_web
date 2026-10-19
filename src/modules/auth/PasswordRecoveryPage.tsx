import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { PasswordRecoveryForm } from "./components/PasswordRecoveryForm";
import { PasswordRecoverySentNotice } from "./components/PasswordRecoverySentNotice";
import { usePasswordRecoveryViewModel } from "./hooks/usePasswordRecoveryViewModel";

// One recovery screen for every role (KAN-36, KAN-132).
export const PasswordRecoveryPage = (): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.VALIDATION,
  ]);
  const passwordRecoveryViewModel = usePasswordRecoveryViewModel();
  const { hasRequestBeenSent, serverErrorAlertReference, serverErrorKey } =
    passwordRecoveryViewModel;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("auth.passwordRecovery.title")}
          </h1>
          <CardDescription>
            {t("auth.passwordRecovery.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {serverErrorKey && (
            <Alert ref={serverErrorAlertReference}>{t(serverErrorKey)}</Alert>
          )}
          {hasRequestBeenSent && <PasswordRecoverySentNotice />}
          <PasswordRecoveryForm
            passwordRecoveryViewModel={passwordRecoveryViewModel}
          />
        </CardContent>
      </Card>
    </main>
  );
};
