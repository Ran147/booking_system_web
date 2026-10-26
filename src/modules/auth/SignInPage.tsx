import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  ALERT_VARIANT,
  Alert,
  AppLink,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/common";
import { ARIA_ROLE, I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import { SignInErrorAlert } from "./components/SignInErrorAlert";
import { SignInForm } from "./components/SignInForm";
import { useSignInViewModel } from "./hooks/useSignInViewModel";
import { useSignOutNotice } from "./hooks/useSignOutNotice";

// One sign-in screen for every role (KAN-28, KAN-128).
export const SignInPage = (): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.COMMON, I18N_NAMESPACE.LANDING]);
  const signInViewModel = useSignInViewModel();
  const wasSignedOutByInactivity = useSignOutNotice();

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2">
            <AppLink
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              to={ROUTE_PATH.LANDING.HOME}
            >
              <span>←</span>
              <span>{t("auth.signIn.backToHome")}</span>
            </AppLink>
          </div>
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
          {signInViewModel.shouldShowSignUpSuccess && (
            <Alert role={ARIA_ROLE.STATUS} variant={ALERT_VARIANT.SUCCESS}>
              {t("landing:subscriberSignUp.success")}
            </Alert>
          )}
          <SignInErrorAlert
            alertReference={signInViewModel.serverErrorAlertReference}
            errorKey={signInViewModel.serverErrorKey}
            passwordRecoveryLocationState={
              signInViewModel.passwordRecoveryLocationState
            }
            shouldShowPasswordRecoveryLink={
              signInViewModel.shouldShowPasswordRecoveryLink
            }
          />
          <SignInForm signInViewModel={signInViewModel} />
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 border-t border-border/40 pt-4 text-center text-xs text-muted-foreground">
          <p>
            {t("auth.signIn.noAccountPrompt")}{" "}
            <AppLink
              className="font-medium text-primary hover:underline"
              to="/#plans-section"
            >
              {t("auth.signIn.explorePlansAction")}
            </AppLink>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
};
