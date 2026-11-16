import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/common";
import type { SupportTicketStatus } from "@/domain";
import { I18N_NAMESPACE } from "@/shared/constants";
import { SUPPORT_TICKET_STATUS_TONE } from "../constants";

export interface SupportTicketStatusBadgeProps {
  readonly status: SupportTicketStatus;
}

export const SupportTicketStatusBadge = ({
  status,
}: SupportTicketStatusBadgeProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.ADMIN);
  const tone = SUPPORT_TICKET_STATUS_TONE[status];

  return (
    <StatusBadge tone={tone}>
      {t(`supportTickets.status.${status}`)}
    </StatusBadge>
  );
};
