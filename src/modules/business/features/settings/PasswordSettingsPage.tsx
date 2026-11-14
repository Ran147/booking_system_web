import { ArrowLeft } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  AppLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageTemplate,
} from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import { ChangePasswordForm } from "./components";

export const PasswordSettingsPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const settingsPath = `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS}`;

  return (
    <PageTemplate
      description={t("settings.password.description")}
      title={t("settings.password.title")}
    >
      <div className="max-w-2xl space-y-4">
        <AppLink className="inline-flex items-center gap-2" to={settingsPath}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("settings.password.backAction")}
        </AppLink>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.password.formTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
};
