import type { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  InputField,
  SelectField,
} from "@/components/common";
import { AUDIT_LOG_ACTION_TYPE, type AuditLogActionType } from "@/domain";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { Nullable } from "@/types";
import type { AuditLogFilterBarProps } from "../models";

export const AuditLogFilterBar = ({
  filters,
  hasActiveFilters,
  isDateRangeInvalid,
  isUnknownActionTypeInUrl,
  onClearFilters,
  onFilterChange,
}: AuditLogFilterBarProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.ADMIN);

  const actionTypeOptions = Object.values(AUDIT_LOG_ACTION_TYPE).map(
    (actionType) => ({
      label: t(`auditLog.actionType.${actionType}`),
      value: actionType,
    }),
  );

  const handleActionTypeChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    const rawValue = event.target.value;
    onFilterChange({
      actionType: (rawValue || null) as Nullable<AuditLogActionType>,
    });
  };

  const handleFromChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onFilterChange({
      from: event.target.value || null,
    });
  };

  const handleToChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onFilterChange({
      to: event.target.value || null,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      {isUnknownActionTypeInUrl && (
        <Alert variant={ALERT_VARIANT.WARNING}>
          {t("auditLog.filters.invalidActionType")}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InputField
          id="audit-log-filter-from"
          label={t("auditLog.filters.from")}
          name="from"
          onChange={handleFromChange}
          type="date"
          value={filters.from ?? ""}
        />

        <InputField
          error={
            isDateRangeInvalid
              ? t("auditLog.filters.invalidDateRange")
              : undefined
          }
          id="audit-log-filter-to"
          label={t("auditLog.filters.to")}
          name="to"
          onChange={handleToChange}
          type="date"
          value={filters.to ?? ""}
        />

        <SelectField
          id="audit-log-filter-action-type"
          label={t("auditLog.filters.actionType")}
          name="actionType"
          onChange={handleActionTypeChange}
          options={actionTypeOptions}
          placeholder={t("auditLog.filters.allActionTypes")}
          value={filters.actionType ?? ""}
        />

        <div className="flex items-end">
          <Button
            disabled={!hasActiveFilters && !isUnknownActionTypeInUrl}
            onClick={onClearFilters}
            type="button"
            variant="outline"
          >
            {t("auditLog.filters.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
};
