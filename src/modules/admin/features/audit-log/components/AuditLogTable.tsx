import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common";
import type { AuditLogEntry } from "@/domain";
import { I18N_NAMESPACE } from "@/shared/constants";
import { formatDateTime } from "@/utils";

export interface AuditLogTableProps {
  readonly entries: readonly AuditLogEntry[];
  readonly onSelectEntry: (entry: AuditLogEntry) => void;
}

export const AuditLogTable = ({
  entries,
  onSelectEntry,
}: AuditLogTableProps): ReactElement => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.ADMIN);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableCaption className="sr-only">
          {t("auditLog.table.caption")}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">{t("auditLog.table.dateTime")}</TableHead>
            <TableHead scope="col">{t("auditLog.table.actor")}</TableHead>
            <TableHead scope="col">{t("auditLog.table.action")}</TableHead>
            <TableHead scope="col">{t("auditLog.table.target")}</TableHead>
            <TableHead className="text-right" scope="col">
              {t("auditLog.table.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const actionKey = `auditLog.actionType.${entry.actionType}`;
            const fallbackAction = t("auditLog.list.unknownAction", {
              action: entry.actionType,
            });
            const actionLabel = t(actionKey, { defaultValue: fallbackAction });
            const formattedDate = formatDateTime(
              entry.createdAt,
              timeZone,
              i18n.language,
            );

            return (
              <TableRow key={entry.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap">
                  {formattedDate}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {entry.actorEmail || entry.actorUserId}
                </TableCell>
                <TableCell className="text-sm">{actionLabel}</TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{entry.targetName}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    aria-label={`${t("auditLog.table.viewDetail")}: ${actionLabel} - ${entry.targetName}`}
                    onClick={() => onSelectEntry(entry)}
                    size="sm"
                    variant="outline"
                  >
                    {t("auditLog.table.viewDetail")}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
