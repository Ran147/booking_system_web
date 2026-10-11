import { Monitor, Moon, Sun } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTemplate,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE, THEME_MODE, type ThemeMode } from "@/constants";
import { ThemeOption } from "./components/ThemeOption";
import { useThemePreferenceViewModel } from "./hooks/useThemePreferenceViewModel";

const THEME_OPTIONS = [
  { icon: Sun, themeMode: THEME_MODE.LIGHT },
  { icon: Moon, themeMode: THEME_MODE.DARK },
  { icon: Monitor, themeMode: THEME_MODE.SYSTEM },
] as const;

export const ThemePreferencePage = (): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.CUSTOMER,
    I18N_NAMESPACE.COMMON,
  ]);
  const { handleThemeChange, isLoading, isSyncError, isSyncing, themeMode } =
    useThemePreferenceViewModel();

  const themeLabel = (mode: ThemeMode): string => t(`common:theme.${mode}`);

  return (
    <PageTemplate
      description={t("customer:profile.preferences.themeDescription")}
      title={t("customer:profile.preferences.themeTitle")}
    >
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>
            {t("customer:profile.preferences.activeTheme", {
              theme: themeLabel(themeMode),
            })}
          </CardTitle>
          <CardDescription>
            {t("customer:profile.preferences.themeDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div
              className="flex items-center justify-center py-8"
              role="status"
            >
              <Spinner />
              <span className="sr-only">{t("common:status.loading")}</span>
            </div>
          ) : (
            <div
              aria-label={t("customer:profile.preferences.themeTitle")}
              className="grid gap-3 sm:grid-cols-3"
              role="group"
            >
              {THEME_OPTIONS.map(({ icon, themeMode: optionMode }) => (
                <ThemeOption
                  description={t(
                    `customer:profile.preferences.themeOptionDescription.${optionMode}`,
                  )}
                  icon={icon}
                  isActive={themeMode === optionMode}
                  isDisabled={isSyncing || themeMode === optionMode}
                  key={optionMode}
                  label={themeLabel(optionMode)}
                  onSelect={handleThemeChange}
                  themeMode={optionMode}
                />
              ))}
            </div>
          )}
          <div aria-live="polite" className="mt-4 min-h-6 text-sm">
            {isSyncing ? (
              <p className="text-muted-foreground">
                {t("customer:profile.preferences.syncing")}
              </p>
            ) : null}
            {isSyncError ? (
              <p className="text-destructive" role="alert">
                {t("customer:profile.preferences.syncError")}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </PageTemplate>
  );
};
