import { Building2, LockKeyhole } from "lucide-react";
import type { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTemplate,
  RadioGroup,
  SelectField,
} from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH, type Language } from "@/constants";
import { SettingsNavigationCard } from "./components";
import { useSettingsPageViewModel } from "./hooks/useSettingsPageViewModel";

export const SettingsPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    canManageBusinessProfile,
    currentLanguage,
    handleLanguageChange,
    handleThemeChange,
    isLanguageSaving,
    isThemeSaving,
    languageOptions,
    showLanguageSaveError,
    showThemeSaveError,
    themeMode,
    themeOptions,
  } = useSettingsPageViewModel();

  const handleSelectChange = (
    changeEvent: ChangeEvent<HTMLSelectElement>,
  ): void => {
    handleLanguageChange(changeEvent.target.value as Language);
  };
  const businessProfilePath = `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.BUSINESS_PROFILE}`;
  const passwordSettingsPath = `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS_PASSWORD}`;

  return (
    <PageTemplate
      description={t("settings.description")}
      title={t("settings.title")}
    >
      <div className="space-y-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t("settings.language.title")}</CardTitle>
            <CardDescription>
              {t("settings.language.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SelectField
              disabled={isLanguageSaving}
              label={t("settings.language.label")}
              onChange={handleSelectChange}
              options={languageOptions}
              placeholder=""
              value={currentLanguage}
            />
            {showLanguageSaveError && (
              <p className="text-sm text-destructive" role="alert">
                {t("settings.language.saveError")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t("settings.theme.title")}</CardTitle>
            <CardDescription>{t("settings.theme.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RadioGroup
              disabled={isThemeSaving}
              label={t("settings.theme.label")}
              onValueChange={handleThemeChange}
              options={themeOptions}
              value={themeMode}
            />
            {showThemeSaveError && (
              <p className="text-sm text-destructive" role="alert">
                {t("settings.theme.saveError")}
              </p>
            )}
          </CardContent>
        </Card>

        <SettingsNavigationCard
          description={t("settings.navigation.password.description")}
          icon={LockKeyhole}
          linkLabel={t("settings.navigation.password.action")}
          title={t("settings.navigation.password.title")}
          to={passwordSettingsPath}
        />

        {canManageBusinessProfile ? (
          <SettingsNavigationCard
            description={t("settings.navigation.businessProfile.description")}
            icon={Building2}
            linkLabel={t("settings.navigation.businessProfile.action")}
            title={t("settings.navigation.businessProfile.title")}
            to={businessProfilePath}
          />
        ) : null}
      </div>
    </PageTemplate>
  );
};
