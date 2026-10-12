import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTemplate,
  RadioGroup,
} from "@/components";
import { I18N_NAMESPACE, type ThemeMode } from "@/constants";
import { useSettingsPageViewModel } from "./hooks/useSettingsPageViewModel";

export const SettingsPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    handleThemeChange,
    isSaving,
    showSaveError,
    themeMode,
    themeOptions,
  } = useSettingsPageViewModel();

  return (
    <PageTemplate
      description={t("settings.description")}
      title={t("settings.title")}
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("settings.theme.title")}</CardTitle>
          <CardDescription>{t("settings.theme.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup
            disabled={isSaving}
            label={t("settings.theme.label")}
            onValueChange={(nextValue): void => {
              handleThemeChange(nextValue as ThemeMode);
            }}
            options={themeOptions}
            value={themeMode}
          />
          {showSaveError ? (
            <p className="text-sm text-destructive" role="alert">
              {t("settings.theme.saveError")}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </PageTemplate>
  );
};
