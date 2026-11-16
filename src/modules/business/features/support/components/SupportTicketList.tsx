import { MessageSquarePlus } from "lucide-react";
import type { JSX, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { SupportTicket } from "@/domain";
import type { SupportTicketListProps } from "./SupportTicketList.types";
import { SupportTicketStatusBadge } from "./SupportTicketStatusBadge";
import { KEYBOARD_KEY } from "../constants/Support.constants";

export const SupportTicketList = ({
  formatDateTime,
  isLoading,
  onOpenCreateModal,
  onSelectTicket,
  tickets,
}: SupportTicketListProps): JSX.Element => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
        <MessageSquarePlus className="mb-4 size-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">
          {t("support.list.emptyTitle")}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("support.list.emptyDescription")}
        </p>
        <Button className="mt-4" onClick={onOpenCreateModal} type="button">
          {t("support.list.emptyAction")}
        </Button>
      </div>
    );
  }

  const handleKeyDown = (
    keyboardEvent: KeyboardEvent<HTMLTableRowElement>,
    ticket: SupportTicket,
  ): void => {
    if (
      keyboardEvent.key === KEYBOARD_KEY.ENTER ||
      keyboardEvent.key === KEYBOARD_KEY.SPACE
    ) {
      keyboardEvent.preventDefault();
      onSelectTicket(ticket);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table aria-label={t("support.list.tableAriaLabel")}>
          <TableHeader>
            <TableRow>
              <TableHead>{t("support.list.subjectHeader")}</TableHead>
              <TableHead className="w-32">
                {t("support.list.statusHeader")}
              </TableHead>
              <TableHead className="w-48">
                {t("support.list.createdAtHeader")}
              </TableHead>
              <TableHead className="w-48">
                {t("support.list.lastUpdateHeader")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                key={ticket.id}
                onClick={(): void => {
                  onSelectTicket(ticket);
                }}
                onKeyDown={(keyboardEvent): void => {
                  handleKeyDown(keyboardEvent, ticket);
                }}
                tabIndex={0}
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex flex-col">
                    <span>{ticket.subject}</span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {ticket.message}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <SupportTicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(ticket.createdAt)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(ticket.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
