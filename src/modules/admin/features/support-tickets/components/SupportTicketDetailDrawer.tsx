import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ALERT_VARIANT, Button, Modal } from "@/components/common";
import { SUPPORT_TICKET_STATUS } from "@/domain";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { Nullable } from "@/types";
import { formatDateTime } from "@/utils/format/formatDateTime";
import type { SupportTicketDetailDrawerProps } from "../models";
import { SupportTicketReplyForm } from "./SupportTicketReplyForm";
import { SupportTicketStatusBadge } from "./SupportTicketStatusBadge";

export const SupportTicketDetailDrawer = ({
  isConfirmModalOpen = false,
  isOpen,
  isReplying = false,
  isResolving = false,
  onClose,
  onCloseConfirmModal,
  onOpenConfirmModal,
  onReply,
  onResolve,
  ticket,
}: SupportTicketDetailDrawerProps): Nullable<ReactElement> => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.ADMIN);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!ticket) {
    return null;
  }

  const isTicketResolved = ticket.status === SUPPORT_TICKET_STATUS.RESOLVED;
  const ownerEmailText =
    ticket.ownerEmail ?? t("supportTickets.detail.ownerUnavailable");

  return (
    <>
      <Modal
        isOpen={isOpen}
        maxWidth="lg"
        onClose={onClose}
        title={t("supportTickets.detail.title")}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                {t("supportTickets.detail.business")}
              </span>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {ticket.businessName}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-muted-foreground">
                {t("supportTickets.detail.ownerEmail")}
              </span>
              <p className="mt-1 text-sm text-foreground">{ownerEmailText}</p>
            </div>

            <div>
              <span className="text-xs font-medium text-muted-foreground">
                {t("supportTickets.detail.status")}
              </span>
              <div className="mt-1">
                <SupportTicketStatusBadge status={ticket.status} />
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-muted-foreground">
                {t("supportTickets.detail.createdAt")}
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTime(ticket.createdAt, timeZone, i18n.language)}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-muted-foreground">
                {t("supportTickets.detail.updatedAt")}
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTime(ticket.updatedAt, timeZone, i18n.language)}
              </p>
            </div>

            {ticket.resolvedAt && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">
                  {t("supportTickets.detail.resolvedAt")}
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(ticket.resolvedAt, timeZone, i18n.language)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              {ticket.subject}
            </h3>
            <div className="rounded-lg bg-muted/40 p-4 text-sm text-foreground whitespace-pre-wrap">
              {ticket.message}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {t("supportTickets.detail.repliesTitle")}
            </h4>

            {ticket.replies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("supportTickets.detail.noReplies")}
              </p>
            ) : (
              <div className="space-y-3">
                {ticket.replies.map((reply) => (
                  <div
                    className="space-y-2 rounded-lg border border-border bg-card p-4"
                    key={reply.id}
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {reply.sentByEmail}
                      </span>
                      <span>
                        {formatDateTime(reply.sentAt, timeZone, i18n.language)}
                      </span>
                    </div>

                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {reply.body}
                    </p>

                    {reply.emailFailed && (
                      <Alert variant={ALERT_VARIANT.WARNING}>
                        {t("supportTickets.reply.emailFailed")}
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {onReply && (
            <SupportTicketReplyForm
              isResolved={isTicketResolved}
              isSubmitting={isReplying}
              onSubmitReply={onReply}
            />
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              {!isTicketResolved && onResolve && (
                <Button
                  disabled={isResolving}
                  onClick={onOpenConfirmModal}
                  variant="outline"
                >
                  {t("supportTickets.resolve.actionButton")}
                </Button>
              )}
            </div>

            <Button onClick={onClose} variant="outline">
              {t("supportTickets.detail.close")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmModalOpen}
        maxWidth="sm"
        onClose={(): void => {
          onCloseConfirmModal?.();
        }}
        title={t("supportTickets.resolve.confirmTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("supportTickets.resolve.confirmMessage")}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              disabled={isResolving}
              onClick={onCloseConfirmModal}
              variant="outline"
            >
              {t("supportTickets.resolve.cancelAction")}
            </Button>
            <Button
              disabled={isResolving}
              isLoading={isResolving}
              onClick={(): void => {
                if (onResolve) {
                  void onResolve();
                }
              }}
            >
              {isResolving
                ? t("supportTickets.resolve.resolving")
                : t("supportTickets.resolve.confirmAction")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
