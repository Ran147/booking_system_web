import { Ban, Plus } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  CursorPagination,
  PageTemplate,
  Tabs,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  AgendaCalendarView,
  BookingDetailDrawer,
  BookingFormDialog,
  BookingHistoryFilters,
  BookingHistoryTable,
  BookingListTable,
  BusinessHoursForm,
  CancelBookingDialog,
  RescheduleBookingDialog,
  ScheduleBlockDialog,
} from "../components";
import { SCHEDULE_TAB, type ScheduleTab } from "../constants";
import { useScheduleViewModel } from "../hooks/useScheduleViewModel";

export const SchedulePage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const viewModel = useScheduleViewModel();

  const tabs = [
    { id: SCHEDULE_TAB.AGENDA, label: t("schedule.tabs.agenda") },
    { id: SCHEDULE_TAB.BOOKINGS, label: t("schedule.tabs.bookings") },
    { id: SCHEDULE_TAB.HISTORY, label: t("schedule.tabs.history") },
    ...(viewModel.canManageScheduleBlocks
      ? [{ id: SCHEDULE_TAB.HOURS, label: t("schedule.tabs.hours") }]
      : []),
  ];

  return (
    <PageTemplate
      actions={
        viewModel.canManageScheduleBlocks || viewModel.canManageBookings ? (
          <div className="flex items-center gap-2">
            {viewModel.canManageScheduleBlocks && (
              <Button
                leftIcon={Ban}
                size={BUTTON_SIZE.SM}
                variant={BUTTON_VARIANT.OUTLINE}
                onClick={viewModel.blockViewModel.openDialog}
              >
                {t("schedule.blocks.newBlockAction")}
              </Button>
            )}
            {viewModel.canManageBookings && (
              <Button
                leftIcon={Plus}
                size={BUTTON_SIZE.SM}
                variant={BUTTON_VARIANT.PRIMARY}
                onClick={() => viewModel.setIsNewBookingOpen(true)}
              >
                {t("schedule.bookingList.newBookingAction")}
              </Button>
            )}
          </div>
        ) : undefined
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
            businessHours={viewModel.businessHours}
            currentDate={viewModel.selectedDate}
            timeZone={viewModel.timeZone}
            viewMode={viewModel.calendarViewMode}
            onDateChange={viewModel.setSelectedDate}
            onDeleteBlock={
              viewModel.canManageScheduleBlocks
                ? viewModel.blockViewModel.handleDeleteBlock
                : undefined
            }
            onSelectBooking={viewModel.handleSelectBooking}
            onViewModeChange={viewModel.setCalendarViewMode}
          />
        )}

        {viewModel.activeTab === SCHEDULE_TAB.BOOKINGS && (
          <div className="flex flex-col gap-4">
            <BookingListTable
              bookings={viewModel.bookingList}
              isLoading={viewModel.isLoading}
              timeZone={viewModel.timeZone}
              onNewBooking={
                viewModel.canManageBookings
                  ? (): void => viewModel.setIsNewBookingOpen(true)
                  : undefined
              }
              onSelectBooking={viewModel.handleSelectBooking}
            />
            {viewModel.totalUpcomingCount > 0 && (
              <CursorPagination
                hasNextPage={viewModel.hasUpcomingNextPage}
                hasPreviousPage={viewModel.hasUpcomingPreviousPage}
                onNextPageClick={viewModel.handleUpcomingNextPage}
                onPreviousPageClick={viewModel.handleUpcomingPreviousPage}
                pageNumber={viewModel.upcomingPage}
                totalCount={viewModel.totalUpcomingCount}
              />
            )}
          </div>
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
            {viewModel.totalHistoryCount > 0 && (
              <CursorPagination
                hasNextPage={viewModel.hasHistoryNextPage}
                hasPreviousPage={viewModel.hasHistoryPreviousPage}
                onNextPageClick={viewModel.handleHistoryNextPage}
                onPreviousPageClick={viewModel.handleHistoryPreviousPage}
                pageNumber={viewModel.historyPage}
                totalCount={viewModel.totalHistoryCount}
              />
            )}
          </div>
        )}

        {viewModel.activeTab === SCHEDULE_TAB.HOURS && <BusinessHoursForm />}

        {/* Dialogs & Modals */}
        <BookingDetailDrawer
          booking={viewModel.selectedBooking}
          canManageBookings={viewModel.canManageBookings}
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
