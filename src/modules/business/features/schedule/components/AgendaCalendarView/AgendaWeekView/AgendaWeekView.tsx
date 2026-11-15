import { Calendar } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { AgendaBlockCard } from "../AgendaBlockCard";
import { AgendaWeekDayColumn } from "../AgendaWeekDayColumn";
import { AGENDA_WEEK_VIEW_CONFIG } from "./AgendaWeekView.constants";
import type { AgendaWeekViewProps } from "./AgendaWeekView.types";

export const AgendaWeekView = ({
  allBlocks,
  hasDeleteBlockAction,
  weekDays,
}: AgendaWeekViewProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div className="flex flex-col gap-6">
      <div className={AGENDA_WEEK_VIEW_CONFIG.WEEK_GRID_CLASS}>
        {weekDays.map((dayItem) => (
          <AgendaWeekDayColumn dayItem={dayItem} key={dayItem.dateKey} />
        ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {allBlocks.map((blockItem) => (
              <AgendaBlockCard
                blockItem={blockItem}
                hasDeleteAction={hasDeleteBlockAction}
                key={blockItem.id}
                onGoToDate={blockItem.onOpenInDayView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

