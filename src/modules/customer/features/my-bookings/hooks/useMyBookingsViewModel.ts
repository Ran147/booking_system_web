import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { ERROR_MESSAGE_KEY, PAGINATION, type ViewState } from "@/constants";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import { mapFirebaseError } from "@/services";
import { useCursorPagination } from "@/shared/hooks";
import type { Nullable } from "@/shared/types";
import { formatDateTime } from "@/shared/utils/format";
import { resolveViewState } from "@/shared/utils/resolveViewState";
import { useBookingBusinessesQueries, useMyBookingsQuery } from "../api";
import {
  MY_BOOKINGS_QUERY_PARAM,
  MY_BOOKINGS_TAB,
  NO_CUSTOMER_USER_ID,
  type MyBookingsTab,
} from "../constants";
import type { MyBookingRow, MyBookingsViewModel } from "../models";
import { buildBookingDetailPath } from "../utils/buildBookingDetailPath";

const readTab = (rawTab: Nullable<string>): MyBookingsTab =>
  rawTab === MY_BOOKINGS_TAB.HISTORY
    ? MY_BOOKINGS_TAB.HISTORY
    : MY_BOOKINGS_TAB.UPCOMING;

export const useMyBookingsViewModel = (): MyBookingsViewModel => {
  const { i18n } = useTranslation();
  const session = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = readTab(searchParams.get(MY_BOOKINGS_QUERY_PARAM.TAB));
  const pagination = useCursorPagination([activeTab]);
  const customerUserId =
    session.status === SESSION_STATUS.SIGNED_IN
      ? session.userId
      : NO_CUSTOMER_USER_ID;

  const bookingsQuery = useMyBookingsQuery({
    customerUserId,
    pageCursor: pagination.currentCursor,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    tab: activeTab,
  });
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
    activeTab,
    errorMessageKey,
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
    handleTabChange: (tabId: string): void => {
      setSearchParams({ [MY_BOOKINGS_QUERY_PARAM.TAB]: readTab(tabId) });
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
