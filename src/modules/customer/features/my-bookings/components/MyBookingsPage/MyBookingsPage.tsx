import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  MY_BOOKINGS_TAB,
  useMyBookingsViewModel,
} from "@/modules/customer/features/my-bookings";
import {
  Button,
  CursorPagination,
  ErrorState,
  PageTemplate,
  Tabs,
  ViewStateSwitch,
} from "@/shared/components";
import { I18N_NAMESPACE, VIEW_STATE } from "@/shared/constants";
import { BookingList } from "../BookingList";

export const MyBookingsPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useMyBookingsViewModel();
  const tabs = [
    { id: MY_BOOKINGS_TAB.UPCOMING, label: t("myBookings.tabs.upcoming") },
    { id: MY_BOOKINGS_TAB.HISTORY, label: t("myBookings.tabs.history") },
  ];
  const emptyMessage = t(`myBookings.${viewModel.activeTab}.empty`);

  return (
    <PageTemplate
      description={t("myBookings.description")}
      title={t("myBookings.title")}
    >
      <Tabs
        activeTabId={viewModel.activeTab}
        ariaLabel={t("myBookings.tabs.label")}
        onTabChange={viewModel.handleTabChange}
        tabs={tabs}
      />
      {viewModel.viewState === VIEW_STATE.ERROR ? (
        <div className="flex flex-col items-center gap-3">
          <ErrorState messageKey={viewModel.errorMessageKey} />
          <Button onClick={viewModel.handleRetry} variant="outline">
            {t("myBookings.retryAction")}
          </Button>
        </div>
      ) : (
        <ViewStateSwitch
          emptyMessage={emptyMessage}
          viewState={viewModel.viewState}
        >
          <BookingList rows={viewModel.rows} />
          <CursorPagination
            hasNextPage={viewModel.hasNextPage}
            hasPreviousPage={viewModel.hasPreviousPage}
            onNextPageClick={viewModel.handleNextPage}
            onPreviousPageClick={viewModel.handlePreviousPage}
            pageNumber={viewModel.pageNumber}
            totalCount={viewModel.totalCount}
          />
        </ViewStateSwitch>
      )}
    </PageTemplate>
  );
};
