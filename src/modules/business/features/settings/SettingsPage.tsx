import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTemplate,
} from "@/components";
import { I18N_NAMESPACE } from "@/constants";
import { ChangePasswordForm } from "./components";

export const SettingsPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <PageTemplate
      description={t("settings.description")}
      title={t("settings.title")}
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("settings.password.title")}</CardTitle>
          <CardDescription>
            {t("settings.password.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </PageTemplate>
  );
};
