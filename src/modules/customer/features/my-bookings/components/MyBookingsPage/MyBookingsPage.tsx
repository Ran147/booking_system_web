import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  MY_BOOKINGS_TAB,
  useMyBookingsViewModel,
} from "@/modules/customer/features/my-bookings";
import {
  Button,
  CursorPagination,
  EmptyState,
  ErrorState,
  PageTemplate,
  Tabs,
  ViewStateSwitch,
} from "@/shared/components";
import { I18N_NAMESPACE, VIEW_STATE } from "@/shared/constants";
import { BookingFilters } from "../BookingFilters";
import { BookingList } from "../BookingList";

export const MyBookingsPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useMyBookingsViewModel();
  const { activeTab, hasActiveFilters, isRangeInvalid } =
    viewModel.filtersViewModel;
  const tabs = [
    { id: MY_BOOKINGS_TAB.UPCOMING, label: t("myBookings.tabs.upcoming") },
    { id: MY_BOOKINGS_TAB.HISTORY, label: t("myBookings.tabs.history") },
  ];
  const isFilteredEmpty =
    viewModel.viewState === VIEW_STATE.EMPTY && hasActiveFilters;

  const renderList = (): ReactElement => {
    if (viewModel.viewState === VIEW_STATE.ERROR) {
      return (
        <div className="flex flex-col items-center gap-3">
          <ErrorState messageKey={viewModel.errorMessageKey} />
          <Button onClick={viewModel.handleRetry} variant="outline">
            {t("myBookings.retryAction")}
          </Button>
        </div>
      );
    }
    if (isFilteredEmpty) {
      return (
        <div className="flex flex-col items-center gap-3">
          <EmptyState message={t("myBookings.filters.noResultsEmpty")} />
          <Button
            onClick={viewModel.filtersViewModel.handleClearFilters}
            variant="outline"
          >
            {t("myBookings.filters.clearAction")}
          </Button>
        </div>
      );
    }

    return (
      <ViewStateSwitch
        emptyMessage={t(`myBookings.${activeTab}.empty`)}
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
    );
  };

  return (
    <PageTemplate
      description={t("myBookings.description")}
      title={t("myBookings.title")}
    >
      <Tabs
        activeTabId={activeTab}
        ariaLabel={t("myBookings.tabs.label")}
        onTabChange={viewModel.filtersViewModel.handleTabChange}
        tabs={tabs}
      />
      <BookingFilters filtersViewModel={viewModel.filtersViewModel} />
      {!isRangeInvalid && renderList()}
    </PageTemplate>
  );
};
