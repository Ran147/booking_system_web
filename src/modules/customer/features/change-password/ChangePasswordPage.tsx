import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { ChangePasswordForm } from "./components";
import { useChangePasswordViewModel } from "./hooks";

export const ChangePasswordPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useChangePasswordViewModel();

  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
          {t("profile.password.title")}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t("profile.password.description")}
        </p>
      </header>
      <Card className="bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{t("profile.password.sectionTitle")}</CardTitle>
          <CardDescription>
            {t("profile.password.securityHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm viewModel={viewModel} />
        </CardContent>
      </Card>
    </main>
  );
};
