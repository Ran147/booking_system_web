import { Bell, BellOff } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageTemplate,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useBookingRemindersViewModel } from "./hooks/useReservationRemindersViewModel";

export const BookingRemindersPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useBookingRemindersViewModel();
  const statusKey = viewModel.isEnabled ? "enabled" : "disabled";
  const actionKey = viewModel.isEnabled ? "disableAction" : "enableAction";

  return (
    <PageTemplate
      description={t("profile.reminders.description")}
      title={t("profile.reminders.title")}
    >
      <Card className="mx-auto w-full max-w-3xl bg-card">
        <CardHeader>
          <CardTitle>{t("profile.reminders.title")}</CardTitle>
          <CardDescription>
            {t("profile.reminders.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {viewModel.isLoading ? (
            <div className="flex justify-center py-8" role="status">
              <Spinner />
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {viewModel.isEnabled ? (
                  <Bell aria-hidden="true" className="size-5 text-primary" />
                ) : (
                  <BellOff
                    aria-hidden="true"
                    className="size-5 text-muted-foreground"
                  />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("profile.reminders.statusLabel")}
                  </p>
                  <p className="font-semibold text-foreground">
                    {t(`profile.reminders.${statusKey}`)}
                  </p>
                </div>
              </div>
              <Button
                aria-checked={viewModel.isEnabled}
                disabled={viewModel.isSaving}
                isLoading={viewModel.isSaving}
                onClick={viewModel.handleToggle}
                role="switch"
                variant={viewModel.isEnabled ? "primary" : "outline"}
              >
                {t(`profile.reminders.${actionKey}`)}
              </Button>
            </div>
          )}
          <div aria-live="polite" className="min-h-6 text-sm">
            {viewModel.isSaving ? (
              <p className="text-muted-foreground" role="status">
                {t("profile.reminders.saving")}
              </p>
            ) : null}
            {viewModel.isSaveError ? (
              <p className="text-destructive" role="alert">
                {t("profile.reminders.saveError")}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </PageTemplate>
  );
};
