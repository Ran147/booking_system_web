import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { ROUTE_PATH, STRING } from "@/constants";
import { mapFirebaseError } from "@/services/firebase";
import { ERROR_MESSAGE_KEY } from "@/shared/constants";
import type { Nullable } from "@/types";
import { formatPrice, formatTime } from "@/utils";
import { useCheckoutSummaryQuery } from "../api/useCheckoutSummaryQuery";
import { useCreateBookingMutation } from "../api/useCreateBookingMutation";
import {
  CHECKOUT_ERROR_ACTION,
  CHECKOUT_SEARCH_PARAM,
} from "../constants/BookingCheckout.constants";
import type { BookingCheckoutViewModel } from "../models/bookingCheckout.model";
import { mapCreateBookingError } from "../utils/mapCreateBookingError";

const MS_PER_MINUTE = 60_000;
// en-CA formats a date as YYYY-MM-DD, the `date` search param of availability.
const ISO_DATE_LOCALE = "en-CA";

const readStartsAt = (value: Nullable<string>): Nullable<Date> => {
  if (!value) return null;
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? null : instant;
};

export const useBookingCheckoutViewModel = (): BookingCheckoutViewModel => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { businessSlug = STRING.EMPTY, serviceId = STRING.EMPTY } = useParams();
  const [searchParams] = useSearchParams();
  const startsAt = readStartsAt(
    searchParams.get(CHECKOUT_SEARCH_PARAM.STARTS_AT),
  );
  const collaboratorId = searchParams.get(
    CHECKOUT_SEARCH_PARAM.COLLABORATOR_ID,
  );
  // C-4: one id per visit of the summary, kept across retries (S-1).
  const [requestId] = useState(() => crypto.randomUUID());
  const [isPolicyAcknowledged, setIsPolicyAcknowledged] = useState(false);

  const summaryQuery = useCheckoutSummaryQuery(businessSlug, serviceId);
  const createBookingMutation = useCreateBookingMutation();
  const summary = startsAt ? (summaryQuery.data ?? null) : null;
  const language = i18n.language;

  // AC-KAN-146-04: missing, inactive or a bad startsAt read as not found.
  const loadErrorKey = summaryQuery.isError
    ? mapFirebaseError(summaryQuery.error).messageKey
    : summaryQuery.isSuccess && !summary
      ? ERROR_MESSAGE_KEY.NOT_FOUND
      : null;
  const confirmError = createBookingMutation.isError
    ? mapCreateBookingError(createBookingMutation.error)
    : null;

  const endsAt =
    summary && startsAt
      ? new Date(startsAt.getTime() + summary.durationMinutes * MS_PER_MINUTE)
      : null;
  const formatDate = (instant: Date, timeZone: string): string =>
    new Intl.DateTimeFormat(language, {
      dateStyle: "full",
      timeZone,
    }).format(instant);

  const goToAvailability = (): void => {
    const availabilityPath = generatePath(
      `${ROUTE_PATH.CUSTOMER.ROOT}/${ROUTE_PATH.CUSTOMER.BOOK_SERVICE}`,
      { businessSlug, serviceId },
    );
    const date =
      startsAt && summary
        ? new Intl.DateTimeFormat(ISO_DATE_LOCALE, {
            day: "2-digit",
            month: "2-digit",
            timeZone: summary.timeZone,
            year: "numeric",
          }).format(startsAt)
        : null;
    void navigate(
      date
        ? `${availabilityPath}?${CHECKOUT_SEARCH_PARAM.DATE}=${date}`
        : availabilityPath,
    );
  };

  const handleConfirm = (): void => {
    if (!summary || !startsAt || createBookingMutation.isPending) return;
    createBookingMutation.mutate(
      {
        businessId: summary.businessId,
        ...(collaboratorId ? { collaboratorId } : {}),
        expectedDurationMinutes: summary.durationMinutes,
        expectedPriceInCents: summary.basePriceInCents,
        requestId,
        serviceId,
        startsAt: startsAt.toISOString(),
      },
      {
        onError: (error): void => {
          // AC-KAN-148-08: reload the summary with the new values.
          if (
            mapCreateBookingError(error).action ===
            CHECKOUT_ERROR_ACTION.RELOAD_SUMMARY
          ) {
            void summaryQuery.refetch();
          }
        },
        onSuccess: ({ bookingId }): void => {
          // replace: going back never lands on a summary that submits again.
          void navigate(
            generatePath(
              `${ROUTE_PATH.CUSTOMER.ROOT}/${ROUTE_PATH.CUSTOMER.BOOK_DONE}`,
              { bookingId, businessSlug },
            ),
            { replace: true },
          );
        },
      },
    );
  };

  return {
    canConfirm:
      summary !== null &&
      (summary.policy === null || isPolicyAcknowledged) &&
      !createBookingMutation.isPending,
    confirmError,
    dateLabel:
      summary && startsAt
        ? formatDate(startsAt, summary.timeZone)
        : STRING.EMPTY,
    durationMinutes: summary?.durationMinutes ?? 0,
    handleAcknowledgePolicy: setIsPolicyAcknowledged,
    handleChangeService: (): void => {
      void navigate(
        generatePath(
          `${ROUTE_PATH.CUSTOMER.ROOT}/${ROUTE_PATH.CUSTOMER.BOOK}`,
          {
            businessSlug,
          },
        ),
      );
    },
    handleChangeTime: goToAvailability,
    handleConfirm,
    handleRetryLoad: (): void => {
      void summaryQuery.refetch();
    },
    isConfirming: createBookingMutation.isPending,
    isLoading: summaryQuery.isPending,
    isPolicyAcknowledged,
    loadErrorKey,
    originalPriceLabel:
      summary && summary.finalPriceInCents !== summary.basePriceInCents
        ? formatPrice(summary.basePriceInCents, summary.currency, language)
        : null,
    priceLabel: summary
      ? formatPrice(summary.finalPriceInCents, summary.currency, language)
      : STRING.EMPTY,
    summary,
    timeLabel:
      summary && startsAt && endsAt
        ? `${formatTime(startsAt, summary.timeZone, language)} – ${formatTime(endsAt, summary.timeZone, language)}`
        : STRING.EMPTY,
  };
};
