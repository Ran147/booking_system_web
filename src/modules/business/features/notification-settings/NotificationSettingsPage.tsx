import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  ErrorState,
  PageTemplate,
  Spinner,
  Switch,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useAlertSettingsViewModel } from "./hooks/useAlertSettingsViewModel";
import type { AlertSettingKey } from "./models/AlertSettings.schema";

const SETTING_KEYS: AlertSettingKey[] = [
  "bookingCreated",
  "bookingCancelledByCustomer",
  "subscriptionEnding",
];

export const NotificationSettingsPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const viewModel = useAlertSettingsViewModel();
  if (viewModel.isLoading) return <Spinner />;
  if (viewModel.isError || !viewModel.settings) return <ErrorState />;
  const settings = viewModel.settings;
  return (
    <PageTemplate
      description={t("notificationSettings.alerts.description")}
      title={t("notificationSettings.alerts.title")}
    >
      {viewModel.isReadOnly ? (
        <p
          className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground"
          role="status"
        >
          {t("notificationSettings.alerts.readOnly")}
        </p>
      ) : null}
      <Card className="divide-y divide-border">
        {SETTING_KEYS.map((key) => (
          <div
            className="flex items-center justify-between gap-6 p-5 sm:p-6"
            key={key}
          >
            <div className="space-y-1">
              <label className="font-medium" htmlFor={`alert-${key}`}>
                {t(`notificationSettings.alerts.options.${key}.label`)}
              </label>
              <p className="text-sm text-muted-foreground">
                {t(`notificationSettings.alerts.options.${key}.description`)}
              </p>
            </div>
            <Switch
              aria-label={t(`notificationSettings.alerts.options.${key}.label`)}
              checked={settings[key]}
              disabled={viewModel.isReadOnly || viewModel.isSaving}
              id={`alert-${key}`}
              onCheckedChange={(checked) =>
                viewModel.changeSetting(key, checked)
              }
            />
          </div>
        ))}
      </Card>
      <p
        aria-live="polite"
        className="text-sm text-muted-foreground"
        role="status"
      >
        {viewModel.isSaving ? t("notificationSettings.alerts.saving") : ""}
      </p>
    </PageTemplate>
  );
};
