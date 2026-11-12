import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/shared/constants";
import { formatDateTime } from "@/utils/format/formatDateTime";
import type { SupportTicketTableProps } from "../models";
import { SupportTicketStatusBadge } from "./SupportTicketStatusBadge";

export const SupportTicketTable = ({
  onSelectTicket,
  tickets,
}: SupportTicketTableProps): ReactElement => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.ADMIN);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Table aria-label={t("supportTickets.table.caption")}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">
            {t("supportTickets.table.business")}
          </TableHead>
          <TableHead scope="col">{t("supportTickets.table.subject")}</TableHead>
          <TableHead scope="col">{t("supportTickets.table.status")}</TableHead>
          <TableHead scope="col">
            {t("supportTickets.table.createdAt")}
          </TableHead>
          <TableHead scope="col">
            {t("supportTickets.table.updatedAt")}
          </TableHead>
          <TableHead className="text-right" scope="col">
            {t("supportTickets.table.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell className="font-medium text-foreground">
              {ticket.businessName || t("supportTickets.table.unnamedBusiness")}
            </TableCell>
            <TableCell className="text-foreground">{ticket.subject}</TableCell>
            <TableCell>
              <SupportTicketStatusBadge status={ticket.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(ticket.createdAt, timeZone, i18n.language)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(ticket.updatedAt, timeZone, i18n.language)}
            </TableCell>
            <TableCell className="text-right">
              <Button
                onClick={(): void => {
                  onSelectTicket(ticket);
                }}
                variant="outline"
              >
                {t("supportTickets.table.viewDetail")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
