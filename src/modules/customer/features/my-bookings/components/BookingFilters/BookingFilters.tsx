import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { MY_BOOKINGS_TAB } from "@/modules/customer/features/my-bookings";
import { Button, InputField, SelectField } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { BookingFiltersProps } from "./BookingFilters.interface";

export const BookingFilters = ({
  filtersViewModel,
}: BookingFiltersProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { filters } = filtersViewModel;
  const isHistory = filtersViewModel.activeTab === MY_BOOKINGS_TAB.HISTORY;

  return (
    <form
      aria-label={t("myBookings.filters.label")}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={(event): void => event.preventDefault()}
    >
      <SelectField
        label={t("myBookings.filters.status")}
        name="status"
        onChange={(event): void =>
          filtersViewModel.handleStatusChange(event.target.value)
        }
        options={filtersViewModel.statusOptions}
        placeholder={t("myBookings.filters.all")}
        value={filters.status ?? ""}
      />
      <SelectField
        label={t("myBookings.filters.business")}
        name="business"
        onChange={(event): void =>
          filtersViewModel.handleFilterChange({
            businessId: event.target.value || null,
          })
        }
        options={filtersViewModel.businessOptions}
        placeholder={t("myBookings.filters.all")}
        value={filters.businessId ?? ""}
      />
      {isHistory && (
        <>
          <InputField
            error={
              filtersViewModel.isRangeInvalid
                ? t("myBookings.filters.invalidRangeError")
                : undefined
            }
            label={t("myBookings.filters.from")}
            name="from"
            onChange={(event): void =>
              filtersViewModel.handleFilterChange({
                from: event.target.value || null,
              })
            }
            type="date"
            value={filters.from ?? ""}
          />
          <InputField
            label={t("myBookings.filters.to")}
            name="to"
            onChange={(event): void =>
              filtersViewModel.handleFilterChange({
                to: event.target.value || null,
              })
            }
            type="date"
            value={filters.to ?? ""}
          />
        </>
      )}
      {filtersViewModel.hasActiveFilters && (
        <div className="flex items-end">
          <Button
            onClick={filtersViewModel.handleClearFilters}
            type="button"
            variant="outline"
          >
            {t("myBookings.filters.clearAction")}
          </Button>
        </div>
      )}
    </form>
  );
};
