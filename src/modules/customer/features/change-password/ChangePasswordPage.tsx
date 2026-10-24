import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTemplate,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { ChangePasswordForm } from "./components";
import { useChangePasswordViewModel } from "./hooks";

export const ChangePasswordPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useChangePasswordViewModel();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <PageTemplate
        description={t("profile.password.description")}
        title={t("profile.password.title")}
      >
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
      </PageTemplate>
    </div>
  );
};
