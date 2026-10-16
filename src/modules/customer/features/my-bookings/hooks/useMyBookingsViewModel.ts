import { useTranslation } from "react-i18next";
import { ERROR_MESSAGE_KEY, PAGINATION, type ViewState } from "@/constants";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import { mapFirebaseError } from "@/services";
import { useCursorPagination } from "@/shared/hooks";
import { formatDateTime } from "@/shared/utils/format";
import { resolveViewState } from "@/shared/utils/resolveViewState";
import { useMyBookingsFilters } from "./useMyBookingsFilters";
import { useBookingBusinessesQueries, useMyBookingsQuery } from "../api";
import { NO_CUSTOMER_USER_ID } from "../constants";
import type { MyBookingRow, MyBookingsViewModel } from "../models";
import { buildBookingDetailPath } from "../utils/buildBookingDetailPath";

// The date range is read in the business time zone when the list is filtered
// by one business; otherwise in the browser's (a range across businesses has
// no single zone).
const readBrowserTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

export const useMyBookingsViewModel = (): MyBookingsViewModel => {
  const { i18n } = useTranslation();
  const session = useSession();
  const customerUserId =
    session.status === SESSION_STATUS.SIGNED_IN
      ? session.userId
      : NO_CUSTOMER_USER_ID;
  const filtersViewModel = useMyBookingsFilters(customerUserId);
  const { activeTab, filters, isRangeInvalid, selectedBusiness } =
    filtersViewModel;
  const timeZone = selectedBusiness?.timeZone ?? readBrowserTimeZone();
  const isWaitingForBusiness =
    filters.businessId !== null && selectedBusiness === null;
  const pagination = useCursorPagination([activeTab, filters, timeZone]);

  const bookingsQuery = useMyBookingsQuery(
    {
      customerUserId,
      filters,
      pageCursor: pagination.currentCursor,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      tab: activeTab,
      timeZone,
    },
    !isRangeInvalid && !isWaitingForBusiness,
  );
  const bookings = bookingsQuery.data?.items ?? [];
  const businessQueries = useBookingBusinessesQueries(
    bookings.map((booking) => booking.businessId),
  );
  const businessById = new Map(
    businessQueries.flatMap((businessQuery) =>
      businessQuery.data ? [[businessQuery.data.id, businessQuery.data]] : [],
    ),
  );

  const rows = bookings.flatMap((booking): MyBookingRow[] => {
    const business = businessById.get(booking.businessId);
    if (!business) return [];

    return [
      {
        businessName: business.name,
        dateTimeLabel: formatDateTime(
          booking.startsAt,
          business.timeZone,
          i18n.language,
        ),
        detailPath: buildBookingDetailPath(business.slug, booking.id),
        id: booking.id,
        serviceName: booking.serviceName,
        status: booking.status,
      },
    ];
  });

  const failedQuery = [bookingsQuery, ...businessQueries].find(
    (query) => query.isError,
  );
  const viewState: ViewState = resolveViewState(
    {
      isError: failedQuery !== undefined,
      isPending:
        bookingsQuery.isPending ||
        (bookings.length > 0 &&
          businessQueries.some((query) => query.isPending)),
    },
    rows.length,
  );
  const errorMessageKey = failedQuery
    ? mapFirebaseError(failedQuery.error).messageKey
    : ERROR_MESSAGE_KEY.UNKNOWN;

  return {
    errorMessageKey,
    filtersViewModel,
    handleNextPage: (): void => {
      // While the next page loads the old data (and its cursor) is still
      // there: a second click would repeat the same cursor.
      if (bookingsQuery.isPlaceholderData) return;
      if (bookingsQuery.data?.nextCursor) {
        pagination.goToNextPage(bookingsQuery.data.nextCursor);
      }
    },
    handlePreviousPage: pagination.goToPreviousPage,
    handleRetry: (): void => {
      void bookingsQuery.refetch();
      businessQueries.forEach((query) => void query.refetch());
    },
    hasNextPage:
      Boolean(bookingsQuery.data?.nextCursor) &&
      !bookingsQuery.isPlaceholderData,
    hasPreviousPage: pagination.hasPreviousPage,
    pageNumber: pagination.pageNumber,
    rows,
    totalCount: bookingsQuery.data?.totalCount ?? 0,
    viewState,
  };
};
