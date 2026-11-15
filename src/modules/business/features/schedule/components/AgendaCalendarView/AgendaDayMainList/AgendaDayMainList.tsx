import { Ban, Clock, Trash2, User } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  BookingStatusLabel,
  Button,
  Card,
  StatusBadge,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { AGENDA_DAY_MAIN_LIST_CONFIG } from "./AgendaDayMainList.constants";
import type { AgendaDayMainListProps } from "./AgendaDayMainList.types";

export const AgendaDayMainList = ({
  bookings,
  hasDeleteBlockAction,
  isEmpty,
  timedBlocks,
  timeZone,
}: AgendaDayMainListProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div className="md:col-span-2 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          {t("schedule.bookings.todayBookingsCount", {
            count: bookings.length,
          })}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t("schedule.bookings.timeZoneNotice", { timeZone })}
        </span>
      </div>

      {isEmpty ? (
        <Card className="p-8 text-center text-muted-foreground text-sm border-dashed">
          {t("schedule.agenda.noBookings")}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {timedBlocks.map((blockItem) => (
            <div
              className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/5 flex items-center justify-between gap-3 text-left w-full shadow-xs"
              key={blockItem.id}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/15 text-destructive">
                  <Ban className="size-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-destructive">
                      {t("schedule.blocks.blockedSlot")}
                    </span>
                    <span className="text-xs font-semibold text-destructive/90 bg-destructive/10 px-2 py-0.5 rounded">
                      {blockItem.formattedTimeRange}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    {blockItem.displayReasonOrScope}
                  </span>
                </div>
              </div>

              {hasDeleteBlockAction && (
                <Button
                  ariaLabel={t("schedule.blocks.deleteAction")}
                  className="text-destructive hover:bg-destructive/15"
                  size={AGENDA_DAY_MAIN_LIST_CONFIG.DELETE_BUTTON_SIZE}
                  variant={AGENDA_DAY_MAIN_LIST_CONFIG.DELETE_BUTTON_VARIANT}
                  onClick={blockItem.onDelete}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}

          {bookings.map((bookingItem) => (
            <Card
              className="p-3.5 flex items-center justify-between cursor-pointer w-full text-left"
              hoverable
              key={bookingItem.id}
              onClick={bookingItem.onSelect}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Clock className="size-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {bookingItem.serviceName}
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {bookingItem.formattedStartTime}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <User className="size-3" />
                    {bookingItem.customerId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">
                  {t("schedule.bookings.durationMinutes", {
                    minutes: bookingItem.durationMinutes,
                  })}
                </span>
                <StatusBadge tone={bookingItem.statusTone}>
                  <BookingStatusLabel status={bookingItem.status} />
                </StatusBadge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
