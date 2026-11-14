import { Clock, Plus, Trash2 } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Card,
  InputField,
  RadioGroup,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  BOOKING_CONFIRMATION_MODE,
  DAYS_OF_WEEK,
  SCHEDULE_CONSTANTS,
  useBusinessHoursViewModel,
  type BookingConfirmationMode,
  type DayOfWeek,
} from "@/modules/business/features/schedule";

export const BusinessHoursForm = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    addRange,
    confirmationMode,
    errorMessage,
    formState,
    isSaving,
    removeRange,
    saveConfirmationMode,
    saveHours,
    setConfirmationMode,
    successMessage,
    timeZone,
    toggleDayOpen,
    updateRange,
  } = useBusinessHoursViewModel();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <Card className="p-6">
        <div className="flex flex-col gap-1 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            {t("schedule.hours.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("schedule.hours.description")} ({timeZone})
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4">
            <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>{errorMessage}</Alert>
          </div>
        )}

        {successMessage && (
          <div className="mt-4">
            <Alert variant={ALERT_VARIANT.SUCCESS}>{successMessage}</Alert>
          </div>
        )}

        <div className="flex flex-col gap-4 mt-6 divide-y divide-border/60">
          {DAYS_OF_WEEK.map((day: DayOfWeek) => {
            const dayData = formState[day];

            return (
              <div
                className="pt-4 flex flex-col md:flex-row md:items-start justify-between gap-4"
                key={day}
              >
                <div className="w-36 flex flex-col gap-1">
                  <span className="font-medium text-foreground capitalize">
                    {day}
                  </span>
                  <Button
                    className="self-start"
                    size={BUTTON_SIZE.SM}
                    variant={
                      dayData.isOpen
                        ? BUTTON_VARIANT.OUTLINE
                        : BUTTON_VARIANT.GHOST
                    }
                    onClick={() => toggleDayOpen(day)}
                  >
                    {dayData.isOpen
                      ? t("schedule.hours.openDay")
                      : t("schedule.hours.closedDay")}
                  </Button>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  {dayData.isOpen ? (
                    dayData.ranges.map((range, rangeIndex) => (
                      <div
                        className="flex items-center gap-3"
                        key={`${day}-range-${rangeIndex}`}
                      >
                        <div className="w-32">
                          <InputField
                            label={t("schedule.hours.from")}
                            type="time"
                            value={range.opensAt}
                            onChange={(event) =>
                              updateRange(
                                day,
                                rangeIndex,
                                "opensAt",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="w-32">
                          <InputField
                            label={t("schedule.hours.to")}
                            type="time"
                            value={range.closesAt}
                            onChange={(event) =>
                              updateRange(
                                day,
                                rangeIndex,
                                "closesAt",
                                event.target.value,
                              )
                            }
                          />
                        </div>

                        {dayData.ranges.length > 1 && (
                          <div className="mt-5">
                            <Button
                              ariaLabel={t("schedule.hours.removeRange")}
                              size={BUTTON_SIZE.ICON}
                              variant={BUTTON_VARIANT.GHOST}
                              onClick={() => removeRange(day, rangeIndex)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic py-2">
                      {t("schedule.hours.closedDay")}
                    </span>
                  )}

                  {dayData.isOpen &&
                    dayData.ranges.length <
                      SCHEDULE_CONSTANTS.MAX_HOURS_RANGES_PER_DAY && (
                      <Button
                        className="self-start"
                        leftIcon={Plus}
                        size={BUTTON_SIZE.SM}
                        variant={BUTTON_VARIANT.GHOST}
                        onClick={() => addRange(day)}
                      >
                        {t("schedule.hours.addRange")}
                      </Button>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <Button
            disabled={isSaving}
            isLoading={isSaving}
            variant={BUTTON_VARIANT.PRIMARY}
            onClick={() => void saveHours()}
          >
            {t("schedule.hours.saveAction")}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-1 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {t("schedule.confirmation.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("schedule.confirmation.description")}
          </p>
        </div>

        <div className="mt-4">
          <RadioGroup
            label={t("schedule.confirmation.title")}
            options={[
              {
                description: t("schedule.confirmation.automaticDescription"),
                label: t("schedule.confirmation.automaticLabel"),
                value: BOOKING_CONFIRMATION_MODE.AUTOMATIC,
              },
              {
                description: t("schedule.confirmation.manualDescription"),
                label: t("schedule.confirmation.manualLabel"),
                value: BOOKING_CONFIRMATION_MODE.MANUAL,
              },
            ]}
            value={confirmationMode}
            onValueChange={(value) =>
              setConfirmationMode(value as BookingConfirmationMode)
            }
          />
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <Button
            disabled={isSaving}
            isLoading={isSaving}
            variant={BUTTON_VARIANT.PRIMARY}
            onClick={() => void saveConfirmationMode()}
          >
            {t("schedule.confirmation.saveAction")}
          </Button>
        </div>
      </Card>
    </div>
  );
};
