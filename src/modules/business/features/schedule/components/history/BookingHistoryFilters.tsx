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
  type ActiveServiceOption,
  type BookingHistoryFilterValues,
} from "@/modules/business/features/schedule";

interface BookingHistoryFiltersProps {
  readonly filters: BookingHistoryFilterValues;
  readonly onClear: () => void;
  readonly onFilterChange: <Key extends keyof BookingHistoryFilterValues>(
    key: Key,
    value: BookingHistoryFilterValues[Key],
  ) => void;
  readonly services?: readonly ActiveServiceOption[];
}

export const BookingHistoryFilters = ({
  filters,
  onClear,
  onFilterChange,
  services = [],
}: BookingHistoryFiltersProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  const statusOptions = [
    {
      label: t("schedule.history.allStatuses"),
      value: SCHEDULE_CONSTANTS.ALL_FILTER_VALUE,
    },
    { label: "Completada", value: BOOKING_STATUS.COMPLETED },
    { label: "Cancelada", value: BOOKING_STATUS.CANCELLED },
    { label: "No se presentó", value: BOOKING_STATUS.NO_SHOW },
    { label: "Confirmada", value: BOOKING_STATUS.CONFIRMED },
  ];

  const serviceOptions = [
    { label: t("schedule.history.allServices"), value: "" },
    ...services.map((service) => ({
      label: service.name,
      value: service.id,
    })),
  ];

  return (
    <Card className="p-4 bg-card/60 border-border">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="w-full md:w-44">
          <InputField
            label={t("schedule.history.dateFrom")}
            type="date"
            value={filters.startDate ?? ""}
            onChange={(event) =>
              onFilterChange("startDate", event.target.value)
            }
          />
        </div>

        <div className="w-full md:w-44">
          <InputField
            label={t("schedule.history.dateTo")}
            type="date"
            value={filters.endDate ?? ""}
            onChange={(event) => onFilterChange("endDate", event.target.value)}
          />
        </div>

        <div className="w-full md:w-44">
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

        <div className="w-full md:w-48">
          <SelectField
            label={t("schedule.history.serviceFilter")}
            options={serviceOptions}
            value={filters.serviceId ?? ""}
            onChange={(event) =>
              onFilterChange("serviceId", event.target.value)
            }
          />
        </div>

        <div className="md:ml-auto">
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
