import { Building2 } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  AppLink,
  APP_LINK_VARIANT,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";

export const BusinessProfileSettingsSection = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const businessProfilePath = `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.BUSINESS_PROFILE}`;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Building2
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-primary"
          />
          <div className="space-y-1">
            <CardTitle>{t("settings.businessProfile.title")}</CardTitle>
            <CardDescription>
              {t("settings.businessProfile.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AppLink to={businessProfilePath} variant={APP_LINK_VARIANT.BUTTON}>
          {t("settings.businessProfile.action")}
        </AppLink>
      </CardContent>
    </Card>
  );
};
