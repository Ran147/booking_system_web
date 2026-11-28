import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/common";
import { EmailVerificationNotice } from "./EmailVerificationNotice";
import { useEmailVerificationViewModel } from "../hooks/useEmailVerificationViewModel";

// Same frame as the password reset page (US-36), for the verification link.
export const EmailVerificationCard = (): ReactElement => {
  const { t } = useTranslation();
  const emailVerificationViewModel = useEmailVerificationViewModel();

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("auth.emailVerification.title")}
          </h1>
          <CardDescription>
            {t("auth.emailVerification.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailVerificationNotice
            emailVerificationViewModel={emailVerificationViewModel}
          />
        </CardContent>
      </Card>
    </main>
  );
};
