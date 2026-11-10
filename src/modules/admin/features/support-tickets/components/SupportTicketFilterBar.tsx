import type { ChangeEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, SelectField } from "@/components/common";
import { SUPPORT_TICKET_STATUS, type SupportTicketStatus } from "@/domain";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { Nullable } from "@/types";
import type { SupportTicketFilterBarProps } from "../models";

export const SupportTicketFilterBar = ({
  onStatusChange,
  selectedStatus,
}: SupportTicketFilterBarProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.ADMIN);

  const statusOptions = Object.values(SUPPORT_TICKET_STATUS).map((status) => ({
    label: t(`supportTickets.status.${status}`),
    value: status,
  }));

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const rawValue = event.target.value;
    onStatusChange((rawValue || null) as Nullable<SupportTicketStatus>);
  };

  const handleClear = (): void => {
    onStatusChange(null);
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end">
      <div className="w-full sm:w-64">
        <SelectField
          id="support-ticket-filter-status"
          label={t("supportTickets.filters.statusLabel")}
          name="status"
          onChange={handleSelectChange}
          options={statusOptions}
          placeholder={t("supportTickets.filters.allStatuses")}
          value={selectedStatus ?? ""}
        />
      </div>

      {selectedStatus !== null && (
        <Button onClick={handleClear} type="button" variant="outline">
          {t("supportTickets.filters.clear")}
        </Button>
      )}
    </div>
  );
};
