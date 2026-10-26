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
} from "@/components";
import { I18N_NAMESPACE, type Language } from "@/constants";
import { ChangePasswordForm } from "./components";
import { useSettingsPageViewModel } from "./hooks/useSettingsPageViewModel";

export const SettingsPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
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
      </div>
    </PageTemplate>
  );
};
