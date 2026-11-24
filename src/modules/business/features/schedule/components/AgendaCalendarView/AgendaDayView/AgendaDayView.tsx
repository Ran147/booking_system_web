import { Ban, Trash2 } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { AgendaDayBlocksSidebar } from "../AgendaDayBlocksSidebar";
import { AgendaDayMainList } from "../AgendaDayMainList";
import { AGENDA_DAY_VIEW_CONFIG } from "./AgendaDayView.constants";
import type { AgendaDayViewProps } from "./AgendaDayView.types";

export const AgendaDayView = ({
  allBlocks,
  dayView,
  hasDeleteBlockAction,
  timeZone,
}: AgendaDayViewProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div className="flex flex-col gap-6">
      {dayView.fullDayBlock && (
        <div
          className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 flex items-center justify-between gap-3 text-destructive shadow-xs"
          role={AGENDA_DAY_VIEW_CONFIG.BANNER_ROLE}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-destructive/20 text-destructive">
              <Ban className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {t("schedule.blocks.allDayBlockedNotice")}
              </span>
              <span className="text-xs text-muted-foreground">
                {dayView.fullDayBlock.displayReasonOrScope}
              </span>
            </div>
          </div>
          {hasDeleteBlockAction && (
            <Button
              className="text-destructive hover:bg-destructive/15 border-destructive/30"
              size={AGENDA_DAY_VIEW_CONFIG.DELETE_BANNER_BUTTON_SIZE}
              variant={AGENDA_DAY_VIEW_CONFIG.DELETE_BANNER_BUTTON_VARIANT}
              onClick={dayView.fullDayBlock.onDelete}
            >
              <Trash2 className="size-3.5 mr-1" />
              {t("schedule.blocks.deleteAction")}
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AgendaDayMainList
          bookings={dayView.bookings}
          hasDeleteBlockAction={hasDeleteBlockAction}
          isEmpty={dayView.isEmpty}
          timedBlocks={dayView.timedBlocks}
          timeZone={timeZone}
        />

        <AgendaDayBlocksSidebar
          allBlocks={allBlocks}
          currentDayBlocks={dayView.currentDayBlocks}
          hasDeleteBlockAction={hasDeleteBlockAction}
        />
      </div>
    </div>
  );
};
