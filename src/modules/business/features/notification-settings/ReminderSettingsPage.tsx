import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  ErrorState,
  PageTemplate,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { ReminderSwitch } from "./components/ReminderSwitch";
import { useReminderSettingsViewModel } from "./hooks/useReminderSettingsViewModel";
import { REMINDER_LEAD_TIMES } from "./models/ReminderSettings.schema";

export const ReminderSettingsPage = (): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.VALIDATION,
  ]);
  const viewModel = useReminderSettingsViewModel();
  if (viewModel.isLoading) return <Spinner />;
  if (viewModel.isError || !viewModel.settings || !viewModel.timeZone)
    return <ErrorState />;
  return (
    <PageTemplate
      description={t("business:notificationSettings.reminders.description")}
      title={t("business:notificationSettings.reminders.title")}
    >
      {viewModel.isReadOnly ? (
        <p
          className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground"
          role="status"
        >
          {t("business:errors.readOnly")}
        </p>
      ) : null}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <label className="font-medium" htmlFor="reminders-enabled">
                {t("business:notificationSettings.reminders.enabledLabel")}
              </label>
              <p className="text-sm text-muted-foreground">
                {t("business:notificationSettings.reminders.emailOnly")}
              </p>
            </div>
            <ReminderSwitch
              checked={viewModel.settings.isEnabled}
              disabled={viewModel.isReadOnly || viewModel.isSaving}
              id="reminders-enabled"
              onCheckedChange={viewModel.toggleEnabled}
            />
          </div>
          <fieldset
            disabled={
              !viewModel.settings.isEnabled ||
              viewModel.isReadOnly ||
              viewModel.isSaving
            }
          >
            <legend className="mb-3 font-medium">
              {t("business:notificationSettings.reminders.leadTimesLabel")}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {REMINDER_LEAD_TIMES.map((minutes) => {
                const selected =
                  viewModel.settings?.leadTimesMinutes.includes(minutes) ??
                  false;
                return (
                  <Button
                    aria-pressed={selected}
                    key={minutes}
                    onClick={() => viewModel.toggleLeadTime(minutes)}
                    type="button"
                    variant={selected ? "primary" : "outline"}
                  >
                    {t(
                      `business:notificationSettings.reminders.leadTimes.${minutes}`,
                    )}
                  </Button>
                );
              })}
            </div>
          </fieldset>
          <p className="text-sm text-muted-foreground">
            {t("business:notificationSettings.reminders.timeZone", {
              timeZone: viewModel.timeZone,
            })}
          </p>
          {viewModel.errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {viewModel.errorMessage}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button
              disabled={
                !viewModel.isDirty || viewModel.isReadOnly || viewModel.isSaving
              }
              isLoading={viewModel.isSaving}
              onClick={viewModel.save}
              type="button"
            >
              {viewModel.isSaving
                ? t("business:notificationSettings.reminders.saving")
                : t("business:notificationSettings.reminders.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageTemplate>
  );
};
