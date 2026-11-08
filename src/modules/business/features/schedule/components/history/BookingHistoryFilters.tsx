import { RotateCcw } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Card,
  InputField,
  SelectField,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BOOKING_STATUS, type BookingStatus } from "@/domain";
import {
  SCHEDULE_CONSTANTS,
  type BookingHistoryFilterValues,
} from "@/modules/business/features/schedule";

interface BookingHistoryFiltersProps {
  readonly filters: BookingHistoryFilterValues;
  readonly onClear: () => void;
  readonly onFilterChange: <Key extends keyof BookingHistoryFilterValues>(
    key: Key,
    value: BookingHistoryFilterValues[Key],
  ) => void;
}

export const BookingHistoryFilters = ({
  filters,
  onClear,
  onFilterChange,
}: BookingHistoryFiltersProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  const statusOptions = [
    {
      label: t("schedule.history.allStatuses"),
      value: SCHEDULE_CONSTANTS.ALL_FILTER_VALUE,
    },
    {
      label: t("common:bookingStatus.completed"),
      value: BOOKING_STATUS.COMPLETED,
    },
    {
      label: t("common:bookingStatus.cancelled"),
      value: BOOKING_STATUS.CANCELLED,
    },
    {
      label: t("common:bookingStatus.no_show"),
      value: BOOKING_STATUS.NO_SHOW,
    },
    {
      label: t("common:bookingStatus.confirmed"),
      value: BOOKING_STATUS.CONFIRMED,
    },
  ];

  return (
    <Card className="p-4 bg-card/60 border-border">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="w-full sm:w-56">
          <InputField
            label={t("schedule.history.dateFilter", { defaultValue: "Date" })}
            type="date"
            value={filters.date ?? filters.startDate ?? ""}
            onChange={(event) => onFilterChange("date", event.target.value)}
          />
        </div>

        <div className="w-full sm:w-56">
          <SelectField
            label={t("schedule.history.statusFilter")}
            options={statusOptions}
            value={filters.status ?? SCHEDULE_CONSTANTS.ALL_FILTER_VALUE}
            onChange={(event) =>
              onFilterChange(
                "status",
                event.target.value as BookingStatus | "all",
              )
            }
          />
        </div>

        <div className="sm:ml-auto">
          <Button
            leftIcon={RotateCcw}
            size={BUTTON_SIZE.SM}
            variant={BUTTON_VARIANT.OUTLINE}
            onClick={onClear}
          >
            {t("schedule.history.clearFilters")}
          </Button>
        </div>
      </div>
    </Card>
  );
};
