import { X } from "lucide-react";
import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Drawer,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { SupportTicketDetailDrawerProps } from "./SupportTicketDetailDrawer.types";
import { SupportTicketStatusBadge } from "./SupportTicketStatusBadge";

export const SupportTicketDetailDrawer = ({
  formatDateTime,
  isOpen,
  onClose,
  ticket,
}: SupportTicketDetailDrawerProps): JSX.Element => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  if (!ticket) {
    return <></>;
  }

  return (
    <Drawer
      className="flex w-full max-w-xl flex-col bg-background shadow-2xl"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex items-center justify-between border-b border-border p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-foreground">
              {ticket.subject}
            </h3>
            <SupportTicketStatusBadge status={ticket.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("support.detail.createdAt", {
              date: formatDateTime(ticket.createdAt),
            })}
          </p>
        </div>
        <Button
          ariaLabel={t("support.actions.close")}
          onClick={onClose}
          size={BUTTON_SIZE.SM}
          type="button"
          variant={BUTTON_VARIANT.GHOST}
        >
          <X className="size-5" />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("support.detail.originalMessage")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {ticket.message}
            </p>
          </CardContent>
        </Card>

        <section aria-labelledby="replies-heading" className="space-y-4">
          <h4
            className="text-base font-semibold text-foreground"
            id="replies-heading"
          >
            {t("support.detail.repliesTitle", {
              count: ticket.replies.length,
            })}
          </h4>

          {ticket.replies.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {t("support.detail.emptyReplies")}
            </div>
          ) : (
            <ol className="space-y-4">
              {ticket.replies.map((reply) => (
                <li
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                  key={reply.id}
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {t("support.detail.supportTeam")}
                    </span>
                    <time dateTime={reply.sentAt.toISOString()}>
                      {formatDateTime(reply.sentAt)}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {reply.body}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="border-t border-border p-4 text-right">
        <Button
          onClick={onClose}
          type="button"
          variant={BUTTON_VARIANT.OUTLINE}
        >
          {t("support.actions.close")}
        </Button>
      </div>
    </Drawer>
  );
};
