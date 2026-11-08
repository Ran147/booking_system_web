import { Ban, Plus } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  PageTemplate,
  Tabs,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { AgendaCalendarView } from "../components/agenda/AgendaCalendarView";
import { ScheduleBlockDialog } from "../components/blocks/ScheduleBlockDialog";
import { BookingDetailDrawer } from "../components/bookings/BookingDetailDrawer";
import { BookingFormDialog } from "../components/bookings/BookingFormDialog";
import { CancelBookingDialog } from "../components/bookings/CancelBookingDialog";
import { RescheduleBookingDialog } from "../components/bookings/RescheduleBookingDialog";
import { BookingHistoryFilters } from "../components/history/BookingHistoryFilters";
import { BookingHistoryTable } from "../components/history/BookingHistoryTable";
import { BusinessHoursForm } from "../components/hours/BusinessHoursForm";
import { BookingListTable } from "../components/list/BookingListTable";
import { SCHEDULE_TAB, type ScheduleTab } from "../constants";
import { useScheduleViewModel } from "../hooks/useScheduleViewModel";

export const SchedulePage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const viewModel = useScheduleViewModel();

  const tabs = [
    { id: SCHEDULE_TAB.AGENDA, label: t("schedule.tabs.agenda") },
    { id: SCHEDULE_TAB.BOOKINGS, label: t("schedule.tabs.bookings") },
    { id: SCHEDULE_TAB.HISTORY, label: t("schedule.tabs.history") },
    { id: SCHEDULE_TAB.HOURS, label: t("schedule.tabs.hours") },
  ];

  return (
    <PageTemplate
      actions={
        <div className="flex items-center gap-2">
          <Button
            leftIcon={Ban}
            size={BUTTON_SIZE.SM}
            variant={BUTTON_VARIANT.OUTLINE}
            onClick={viewModel.blockViewModel.openDialog}
          >
            {t("schedule.blocks.newBlockAction")}
          </Button>
          <Button
            leftIcon={Plus}
            size={BUTTON_SIZE.SM}
            variant={BUTTON_VARIANT.PRIMARY}
            onClick={() => viewModel.setIsNewBookingOpen(true)}
          >
            {t("schedule.bookingList.newBookingAction")}
          </Button>
        </div>
      }
      description={t("schedule.agenda.description")}
      title={t("schedule.agenda.title")}
    >
      <div className="flex flex-col gap-6">
        <Tabs
          activeTabId={viewModel.activeTab}
          tabs={tabs}
          onTabChange={(tabId) => viewModel.setActiveTab(tabId as ScheduleTab)}
        />

        {viewModel.activeTab === SCHEDULE_TAB.AGENDA && (
          <AgendaCalendarView
            blocks={viewModel.scheduleBlocks}
            bookings={viewModel.agendaBookings}
            currentDate={viewModel.selectedDate}
            timeZone={viewModel.timeZone}
            viewMode={viewModel.calendarViewMode}
            onDateChange={viewModel.setSelectedDate}
            onDeleteBlock={viewModel.blockViewModel.handleDeleteBlock}
            onSelectBooking={viewModel.handleSelectBooking}
            onViewModeChange={viewModel.setCalendarViewMode}
          />
        )}

        {viewModel.activeTab === SCHEDULE_TAB.BOOKINGS && (
          <BookingListTable
            bookings={viewModel.bookingList}
            isLoading={viewModel.isLoading}
            timeZone={viewModel.timeZone}
            onSelectBooking={viewModel.handleSelectBooking}
          />
        )}

        {viewModel.activeTab === SCHEDULE_TAB.HISTORY && (
          <div className="flex flex-col gap-4">
            <BookingHistoryFilters
              filters={viewModel.historyFilters}
              onClear={viewModel.handleClearFilters}
              onFilterChange={viewModel.handleFilterChange}
            />
            <BookingHistoryTable
              bookings={viewModel.bookingHistory}
              isLoading={viewModel.isLoading}
              timeZone={viewModel.timeZone}
              onSelectBooking={viewModel.handleSelectBooking}
            />
          </div>
        )}

        {viewModel.activeTab === SCHEDULE_TAB.HOURS && <BusinessHoursForm />}

        {/* Dialogs & Modals */}
        <BookingDetailDrawer
          booking={viewModel.selectedBooking}
          hasStarted={viewModel.selectedBookingHasStarted}
          isOpen={viewModel.isDetailOpen}
          timeZone={viewModel.timeZone}
          onCancelClick={viewModel.handleOpenCancel}
          onClose={viewModel.handleCloseDetail}
          onRescheduleClick={viewModel.handleOpenReschedule}
        />

        <BookingFormDialog
          isOpen={viewModel.isNewBookingOpen}
          onClose={() => viewModel.setIsNewBookingOpen(false)}
        />

        <ScheduleBlockDialog viewModel={viewModel.blockViewModel} />

        <RescheduleBookingDialog
          booking={viewModel.selectedBooking}
          isOpen={viewModel.isRescheduleOpen}
          onClose={viewModel.handleCloseReschedule}
        />

        <CancelBookingDialog
          booking={viewModel.selectedBooking}
          isOpen={viewModel.isCancelOpen}
          onClose={viewModel.handleCloseCancel}
        />
      </div>
    </PageTemplate>
  );
};
