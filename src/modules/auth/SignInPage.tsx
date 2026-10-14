import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/common";
import { SignInErrorAlert } from "./components/SignInErrorAlert";
import { SignInForm } from "./components/SignInForm";
import { useSignInViewModel } from "./hooks/useSignInViewModel";
import { useSignOutNotice } from "./hooks/useSignOutNotice";

// One sign-in screen for every role (KAN-28, KAN-128).
export const SignInPage = (): ReactElement => {
  const { t } = useTranslation();
  const signInViewModel = useSignInViewModel();
  const wasSignedOutByInactivity = useSignOutNotice();

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("auth.signIn.title")}
          </h1>
          <CardDescription>{t("auth.signIn.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {wasSignedOutByInactivity && (
            <Alert variant={ALERT_VARIANT.WARNING}>
              {t("auth.idle.signedOut")}
            </Alert>
          )}
          <SignInErrorAlert
            alertReference={signInViewModel.serverErrorAlertReference}
            errorKey={signInViewModel.serverErrorKey}
            shouldShowPasswordRecoveryLink={
              signInViewModel.shouldShowPasswordRecoveryLink
            }
          />
          <SignInForm signInViewModel={signInViewModel} />
        </CardContent>
      </Card>
    </main>
  );
};
