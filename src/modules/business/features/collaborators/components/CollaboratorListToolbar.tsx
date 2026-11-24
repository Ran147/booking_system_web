import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  BADGE_VARIANT,
  SearchInput,
  SelectField,
  type SelectFieldOption,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { COLLABORATOR_STATUS, type CollaboratorStatus } from "@/domain";
import type { Nullable } from "@/types";
import { COLLABORATOR_ALL_STATUS_FILTER } from "../constants/CollaboratorFeature.constants";
import type {
  CollaboratorListFilters,
  CollaboratorUsageSummary,
} from "../models";

interface CollaboratorListToolbarProps {
  readonly filters: CollaboratorListFilters;
  readonly onSearchChange: (searchTerm: string) => void;
  readonly onStatusFilterChange: (status: CollaboratorStatus | "") => void;
  readonly usage: Nullable<CollaboratorUsageSummary>;
}

export const CollaboratorListToolbar = ({
  filters,
  onSearchChange,
  onStatusFilterChange,
  usage,
}: CollaboratorListToolbarProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  const statusOptions: SelectFieldOption[] = [
    {
      label: t("business:collaborators.list.statusFilterAll"),
      value: COLLABORATOR_ALL_STATUS_FILTER,
    },
    {
      label: t("common:collaboratorStatus.active"),
      value: COLLABORATOR_STATUS.ACTIVE,
    },
    {
      label: t("common:collaboratorStatus.invited"),
      value: COLLABORATOR_STATUS.INVITED,
    },
    {
      label: t("common:collaboratorStatus.inactive"),
      value: COLLABORATOR_STATUS.INACTIVE,
    },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            label={t("business:collaborators.list.searchLabel")}
            onValueChange={onSearchChange}
            value={filters.searchTerm}
          />
        </div>
        <div className="w-full sm:w-56">
          <SelectField
            label={t("business:collaborators.list.statusFilterLabel")}
            onChange={(event): void => {
              onStatusFilterChange(
                event.target.value as CollaboratorStatus | "",
              );
            }}
            options={statusOptions}
            value={filters.status}
          />
        </div>
      </div>

      {usage && typeof usage.limit === "number" && (
        <Badge variant={BADGE_VARIANT.SECONDARY}>
          {t("business:collaborators.limit.countSummary", {
            limit: usage.limit,
            used: usage.used,
          })}
        </Badge>
      )}
    </div>
  );
};
