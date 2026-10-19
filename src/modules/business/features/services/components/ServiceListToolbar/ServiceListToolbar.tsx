import { X } from "lucide-react";
import type { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, SearchInput, SelectField } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { SERVICE_STATUS } from "@/domain";
import type { ServiceListToolbarProps } from "./types/ServiceListToolbar.types";

export const ServiceListToolbar = ({
  hasActiveFilters,
  onClearFilters,
  onSearchChange,
  onStatusChange,
  searchTerm,
  status,
}: ServiceListToolbarProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  const statusOptions = [
    {
      label: t("services.list.filterStatusAll"),
      value: "",
    },
    {
      label: t("services.list.filterStatusActive"),
      value: SERVICE_STATUS.ACTIVE,
    },
    {
      label: t("services.list.filterStatusInactive"),
      value: SERVICE_STATUS.INACTIVE,
    },
  ];

  const handleStatusSelectChange = (
    changeEvent: ChangeEvent<HTMLSelectElement>,
  ): void => {
    onStatusChange(changeEvent.target.value);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-72">
          <SearchInput
            label={t("services.list.searchLabel")}
            onValueChange={onSearchChange}
            value={searchTerm}
          />
        </div>

        <div className="w-full sm:w-48">
          <SelectField
            aria-label={t("services.list.filterStatusLabel")}
            name="statusFilter"
            onChange={handleStatusSelectChange}
            options={statusOptions}
            placeholder=""
            value={status}
          />
        </div>

        {hasActiveFilters && (
          <Button
            ariaLabel={t("services.list.clearFiltersAction")}
            leftIcon={X}
            onClick={onClearFilters}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("services.list.clearFiltersAction")}
          </Button>
        )}
      </div>
    </div>
  );
};
