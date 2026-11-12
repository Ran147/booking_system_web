import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink, Button, Modal } from "@/components/common";
import { ROUTE_PATH } from "@/constants/routes/RoutePath.constants";
import {
  AUDIT_LOG_TARGET_TYPE,
  type AuditLogEntry,
  type AuditLogTargetType,
} from "@/domain";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { Nullable } from "@/types";
import { formatDateTime } from "@/utils";
import { AUDIT_LOG_INDENT } from "../constants";

export interface AuditLogDetailModalProps {
  readonly entry: Nullable<AuditLogEntry>;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const resolveTargetHref = (targetType: AuditLogTargetType): string => {
  if (targetType === AUDIT_LOG_TARGET_TYPE.BUSINESS) {
    return `${ROUTE_PATH.ADMIN.ROOT}/${ROUTE_PATH.ADMIN.BUSINESSES}`;
  }
  if (targetType === AUDIT_LOG_TARGET_TYPE.PLAN) {
    return `${ROUTE_PATH.ADMIN.ROOT}/${ROUTE_PATH.ADMIN.PLANS}`;
  }
  return ROUTE_PATH.ADMIN.ROOT;
};

export const AuditLogDetailModal = ({
  entry,
  isOpen,
  onClose,
}: AuditLogDetailModalProps): Nullable<ReactElement> => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.ADMIN);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!entry) {
    return null;
  }

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
  const targetHref = resolveTargetHref(entry.targetType);

  return (
    <Modal
      isOpen={isOpen}
      maxWidth="lg"
      onClose={onClose}
      title={t("auditLog.detail.title")}
    >
      <div className="space-y-6 text-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="font-medium text-muted-foreground">
              {t("auditLog.detail.dateTime")}
            </p>
            <p className="mt-1 font-mono text-foreground">{formattedDate}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">
              {t("auditLog.detail.actor")}
            </p>
            <p className="mt-1 font-medium text-foreground">
              {entry.actorEmail}
            </p>
            <p className="text-xs text-muted-foreground">{entry.actorUserId}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">
              {t("auditLog.detail.action")}
            </p>
            <p className="mt-1 font-medium text-foreground">{actionLabel}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">
              {t("auditLog.detail.target")}
            </p>
            <p className="mt-1 font-medium text-foreground">
              {entry.targetName}
            </p>
            <AppLink className="text-xs font-medium" to={targetHref}>
              {`${t("auditLog.detail.targetId")}: ${entry.targetId}`}
            </AppLink>
          </div>
        </div>

        {entry.reason && (
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="font-semibold text-foreground">
              {t("auditLog.detail.reason")}
            </p>
            <p className="mt-1 text-muted-foreground">{entry.reason}</p>
          </div>
        )}

        {(entry.before || entry.after) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-muted-foreground">
                {t("auditLog.detail.before")}
              </p>
              <pre className="mt-1 max-h-48 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
                {entry.before
                  ? JSON.stringify(
                      entry.before,
                      null,
                      AUDIT_LOG_INDENT.JSON_SPACES,
                    )
                  : t("auditLog.detail.noChanges")}
              </pre>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">
                {t("auditLog.detail.after")}
              </p>
              <pre className="mt-1 max-h-48 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
                {entry.after
                  ? JSON.stringify(
                      entry.after,
                      null,
                      AUDIT_LOG_INDENT.JSON_SPACES,
                    )
                  : t("auditLog.detail.noChanges")}
              </pre>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            {t("auditLog.detail.close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
