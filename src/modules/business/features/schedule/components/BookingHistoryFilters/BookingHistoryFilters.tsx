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
import { useBookingHistoryFiltersViewModel } from "@/modules/business/features/schedule";
import { BOOKING_HISTORY_FILTERS_CONFIG } from "./BookingHistoryFilters.constants";
import type { BookingHistoryFiltersProps } from "./BookingHistoryFilters.types";

export const BookingHistoryFilters = ({
  filters,
  onClear,
  onFilterChange,
}: BookingHistoryFiltersProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    dateValue,
    handleDateChange,
    handleStatusChange,
    statusOptions,
    statusValue,
  } = useBookingHistoryFiltersViewModel({ filters, onFilterChange });

  return (
    <Card className="p-4 bg-card/60 border-border">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="w-full sm:w-56">
          <InputField
            label={t("schedule.history.dateFilter")}
            type={BOOKING_HISTORY_FILTERS_CONFIG.DATE_INPUT_TYPE}
            value={dateValue}
            onChange={handleDateChange}
          />
        </div>

        <div className="w-full sm:w-56">
          <SelectField
            label={t("schedule.history.statusFilter")}
            options={statusOptions}
            value={statusValue}
            onChange={handleStatusChange}
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
