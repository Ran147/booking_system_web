import type { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTemplate,
  SelectField,
} from "@/components";
import { I18N_NAMESPACE, type Language } from "@/constants";
import { useSettingsPageViewModel } from "./hooks/useSettingsPageViewModel";

export const SettingsPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    currentLanguage,
    handleLanguageChange,
    isSaving,
    languageOptions,
    showSaveError,
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
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("settings.language.title")}</CardTitle>
          <CardDescription>
            {t("settings.language.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SelectField
            disabled={isSaving}
            label={t("settings.language.label")}
            onChange={handleSelectChange}
            options={languageOptions}
            placeholder=""
            value={currentLanguage}
          />
          {showSaveError && (
            <p className="text-sm text-destructive" role="alert">
              {t("settings.language.saveError")}
            </p>
          )}
        </CardContent>
      </Card>
    </PageTemplate>
  );
};
