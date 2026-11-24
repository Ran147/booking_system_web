import { Ban, Calendar, Clock, Trash2 } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { AgendaBlockCard } from "../AgendaBlockCard";
import { AGENDA_DAY_BLOCKS_SIDEBAR_CONFIG } from "./AgendaDayBlocksSidebar.constants";
import type { AgendaDayBlocksSidebarProps } from "./AgendaDayBlocksSidebar.types";

export const AgendaDayBlocksSidebar = ({
  allBlocks,
  currentDayBlocks,
  hasDeleteBlockAction,
}: AgendaDayBlocksSidebarProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <h3 className="text-sm font-semibold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Ban className="size-4 text-destructive" />
            {t("schedule.blocks.currentDayTitle")}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
            {currentDayBlocks.length}
          </span>
        </h3>

        {currentDayBlocks.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground text-xs border-dashed">
            {t("schedule.bookings.noBlocksForDate")}
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {currentDayBlocks.map((blockItem) => (
              <div
                className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 flex flex-col gap-2 text-xs shadow-xs"
                key={blockItem.id}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-destructive" />
                    {blockItem.formattedTimeRange}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-destructive/15 text-destructive font-medium text-[11px]">
                    {blockItem.scopeLabel}
                  </span>
                </div>
                {blockItem.reason && (
                  <span className="text-foreground/80 font-medium">
                    {blockItem.reason}
                  </span>
                )}
                {hasDeleteBlockAction && (
                  <div className="flex justify-end pt-1">
                    <Button
                      className="text-destructive hover:bg-destructive/15 h-7 text-xs"
                      size={AGENDA_DAY_BLOCKS_SIDEBAR_CONFIG.DELETE_BUTTON_SIZE}
                      variant={
                        AGENDA_DAY_BLOCKS_SIDEBAR_CONFIG.DELETE_BUTTON_VARIANT
                      }
                      onClick={blockItem.onDelete}
                    >
                      <Trash2 className="size-3 mr-1" />
                      {t("schedule.blocks.deleteAction")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <h3 className="text-sm font-semibold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            {t("schedule.blocks.allActiveBlocksTitle")}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {allBlocks.length}
          </span>
        </h3>

        {allBlocks.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground text-xs border-dashed">
            {t("schedule.blocks.noBlocksRegistered")}
          </Card>
        ) : (
          <div
            className={AGENDA_DAY_BLOCKS_SIDEBAR_CONFIG.ALL_BLOCKS_LIST_CLASS}
          >
            {allBlocks.map((blockItem) => (
              <AgendaBlockCard
                blockItem={blockItem}
                hasDeleteAction={hasDeleteBlockAction}
                isHighlighted={blockItem.isSelectedDate}
                key={blockItem.id}
                onGoToDate={blockItem.onFocusDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
