import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import {
  ERROR_MESSAGE_KEY,
  ROUTE_PATH,
  VIEW_STATE,
  type ErrorMessageKey,
  type ViewState,
} from "@/constants";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import { mapFirebaseError } from "@/services";
import type { Nullable } from "@/shared/types";
import { formatDateTime, formatPrice } from "@/shared/utils/format";
import { useBookingBusinessBySlugQuery, useMyBookingQuery } from "../api";
import { NO_CUSTOMER_USER_ID } from "../constants";
import type { BookingDetailView, BookingDetailViewModel } from "../models";

const NOT_FOUND_MESSAGE_KEYS: readonly ErrorMessageKey[] = [
  ERROR_MESSAGE_KEY.NOT_FOUND,
  ERROR_MESSAGE_KEY.PERMISSION_DENIED,
];

// A missing booking and another customer's booking look the same to the
// customer: the rules answer permission-denied for both (AC-KAN-152-04).
const resolveErrorMessageKey = (error: unknown): ErrorMessageKey => {
  const { messageKey } = mapFirebaseError(error);

  return NOT_FOUND_MESSAGE_KEYS.includes(messageKey)
    ? ERROR_MESSAGE_KEY.NOT_FOUND
    : messageKey;
};

export const useBookingDetailViewModel = (): BookingDetailViewModel => {
  const { i18n } = useTranslation();
  const session = useSession();
  const { bookingId = "", businessSlug = "" } = useParams();
  const customerUserId =
    session.status === SESSION_STATUS.SIGNED_IN
      ? session.userId
      : NO_CUSTOMER_USER_ID;

  const businessQuery = useBookingBusinessBySlugQuery(businessSlug);
  const business = businessQuery.data ?? undefined;
  const bookingQuery = useMyBookingQuery({
    bookingId,
    businessId: businessQuery.isSuccess ? business?.id : undefined,
    customerUserId,
  });
  const booking = bookingQuery.data ?? undefined;

  const failedQuery = [businessQuery, bookingQuery].find(
    (query) => query.isError,
  );
  const isMissing =
    (businessQuery.isSuccess && business === undefined) ||
    (bookingQuery.isSuccess && booking === undefined);
  const errorMessageKey = failedQuery
    ? resolveErrorMessageKey(failedQuery.error)
    : ERROR_MESSAGE_KEY.NOT_FOUND;

  let viewState: ViewState = VIEW_STATE.READY;
  if (failedQuery || isMissing) viewState = VIEW_STATE.ERROR;
  else if (!business || !booking) viewState = VIEW_STATE.LOADING;

  const detail: Nullable<BookingDetailView> =
    business && booking
      ? {
          businessName: business.name,
          cancellation: booking.cancellation,
          collaboratorName: booking.collaboratorName,
          durationMinutes: booking.durationMinutes,
          endsAtLabel: formatDateTime(
            booking.endsAt,
            business.timeZone,
            i18n.language,
          ),
          priceLabel: formatPrice(
            booking.priceInCents,
            business.currency,
            i18n.language,
          ),
          serviceName: booking.serviceName,
          startsAtLabel: formatDateTime(
            booking.startsAt,
            business.timeZone,
            i18n.language,
          ),
          status: booking.status,
        }
      : null;

  return {
    detail,
    errorMessageKey,
    handleRetry: (): void => {
      void businessQuery.refetch();
      void bookingQuery.refetch();
    },
    isRetryable:
      failedQuery !== undefined &&
      errorMessageKey !== ERROR_MESSAGE_KEY.NOT_FOUND,
    listPath: `/${businessSlug}/${ROUTE_PATH.CUSTOMER.MY_BOOKINGS}`,
    viewState,
  };
};
