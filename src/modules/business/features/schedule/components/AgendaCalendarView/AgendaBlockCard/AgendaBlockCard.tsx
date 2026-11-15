import { Calendar, Clock, Trash2 } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { cn } from "@/utils";
import { AGENDA_BLOCK_CARD_CONFIG } from "./AgendaBlockCard.constants";
import type { AgendaBlockCardProps } from "./AgendaBlockCard.types";

export const AgendaBlockCard = ({
  blockItem,
  hasDeleteAction,
  isHighlighted = false,
  onGoToDate,
}: AgendaBlockCardProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div
      className={cn(
        "p-3 rounded-xl border flex flex-col gap-2 text-xs transition-colors shadow-xs",
        isHighlighted
          ? "border-destructive/60 bg-destructive/10 ring-1 ring-destructive/40"
          : "border-border/80 bg-card hover:border-destructive/30",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="size-3.5 text-destructive" />
          {blockItem.formattedDate}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-destructive/15 text-destructive font-medium text-[11px]">
          {blockItem.scopeLabel}
        </span>
      </div>

      <div className="flex items-center justify-between text-muted-foreground">
        <span className="flex items-center gap-1 font-medium">
          <Clock className="size-3 text-destructive/80" />
          {blockItem.formattedTimeRange}
        </span>
        {blockItem.reason && (
          <span
            className="font-medium text-foreground/90 max-w-[120px] truncate"
            title={blockItem.reason}
          >
            {blockItem.reason}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <Button
          className="h-6 text-[11px] px-2 text-primary hover:text-primary/80"
          size={AGENDA_BLOCK_CARD_CONFIG.ACTION_BUTTON_SIZE}
          variant={AGENDA_BLOCK_CARD_CONFIG.ACTION_BUTTON_VARIANT}
          onClick={onGoToDate}
        >
          {t("schedule.blocks.goToDate")}
        </Button>
        {hasDeleteAction && (
          <Button
            className="h-6 text-[11px] px-2 text-destructive hover:bg-destructive/15"
            size={AGENDA_BLOCK_CARD_CONFIG.ACTION_BUTTON_SIZE}
            variant={AGENDA_BLOCK_CARD_CONFIG.ACTION_BUTTON_VARIANT}
            onClick={blockItem.onDelete}
          >
            <Trash2 className="size-3 mr-1" />
            {t("schedule.blocks.deleteAction")}
          </Button>
        )}
      </div>
    </div>
  );
};

