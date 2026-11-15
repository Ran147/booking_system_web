import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  generatePath,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { ROUTE_PATH, STRING } from "@/constants";
import type { Nullable } from "@/types";
import { useAvailabilityQuery } from "../api/useAvailabilityQuery";
import { useBookingContextQuery } from "../api/useBookingContextQuery";
import { useFirstAvailableDateQuery } from "../api/useFirstAvailableDateQuery";
import {
  AVAILABILITY,
  AVAILABILITY_ERROR_ACTION,
  AVAILABILITY_SEARCH_PARAM,
} from "../constants/Availability.constants";
import type {
  AvailabilityErrorView,
  AvailabilityViewModel,
} from "../models/availability.model";
import {
  buildWeekDays,
  listOpenDays,
  readLastBookableDay,
} from "../utils/buildWeekDays";
import {
  addCalendarDays,
  countDaysBetween,
  formatZonedDate,
} from "../utils/calendarDate";
import { mapAvailabilityError } from "../utils/mapAvailabilityError";

const SERVICE_UNAVAILABLE_VIEW: AvailabilityErrorView = {
  action: AVAILABILITY_ERROR_ACTION.BACK_TO_SERVICES,
  commonMessageKey: null,
  messageKey: "availability.errors.serviceUnavailable",
};

// First day of the week (counted from today) that contains `date`.
const readWeekStart = (today: string, date: string): string =>
  addCalendarDays(
    today,
    Math.floor(countDaysBetween(today, date) / AVAILABILITY.DAYS_PER_WEEK) *
      AVAILABILITY.DAYS_PER_WEEK,
  );

export const useAvailabilityViewModel = (): AvailabilityViewModel => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { businessSlug = STRING.EMPTY, serviceId = STRING.EMPTY } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get(AVAILABILITY_SEARCH_PARAM.DATE);
  const collaboratorId = searchParams.get(
    AVAILABILITY_SEARCH_PARAM.COLLABORATOR_ID,
  );
  const [weekStart, setWeekStart] = useState<Nullable<string>>(null);
  const [selectedSlotStartsAt, setSelectedSlotStartsAt] = useState<string>(
    STRING.EMPTY,
  );
  const [openedAt] = useState(() => new Date());

  const contextQuery = useBookingContextQuery(businessSlug, serviceId);
  const context = contextQuery.data ?? null;
  const today = context ? formatZonedDate(openedAt, context.timeZone) : null;
  const openDays = useMemo(
    () => (context && today ? listOpenDays(context.businessHours, today) : []),
    [context, today],
  );

  const firstDateQuery = useFirstAvailableDateQuery(
    context && today && !dateParam
      ? {
          businessId: context.businessId,
          collaboratorId,
          openDays,
          serviceId,
          today,
        }
      : null,
  );
  const selectedDate = dateParam ?? firstDateQuery.data ?? null;

  const dayQuery = useAvailabilityQuery(
    context && selectedDate
      ? {
          businessId: context.businessId,
          collaboratorId,
          date: selectedDate,
          serviceId,
        }
      : null,
  );

  const shownWeekStart =
    weekStart ??
    (today && selectedDate ? readWeekStart(today, selectedDate) : today);
  const weekDays =
    context && today && shownWeekStart
      ? buildWeekDays({
          businessHours: context.businessHours,
          firstDay: shownWeekStart,
          today,
        })
      : [];

  const failedQuery = [contextQuery, firstDateQuery, dayQuery].find(
    (query) => query.isError,
  );
  const errorView = failedQuery
    ? mapAvailabilityError(failedQuery.error)
    : contextQuery.isSuccess && !context
      ? SERVICE_UNAVAILABLE_VIEW
      : null;

  const handleSelectDate = (date: string): void => {
    setSelectedSlotStartsAt(STRING.EMPTY);
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(AVAILABILITY_SEARCH_PARAM.DATE, date);
        return next;
      },
      { replace: true },
    );
  };

  const moveWeek = (weeks: number): void => {
    if (!shownWeekStart) return;
    setWeekStart(
      addCalendarDays(shownWeekStart, weeks * AVAILABILITY.DAYS_PER_WEEK),
    );
  };

  const handleContinue = (): void => {
    if (!selectedSlotStartsAt) return;
    const confirmSearch = new URLSearchParams({
      [AVAILABILITY_SEARCH_PARAM.STARTS_AT]: selectedSlotStartsAt,
      ...(collaboratorId
        ? { [AVAILABILITY_SEARCH_PARAM.COLLABORATOR_ID]: collaboratorId }
        : {}),
    });
    void navigate(
      `${generatePath(`${ROUTE_PATH.CUSTOMER.ROOT}/${ROUTE_PATH.CUSTOMER.BOOK_CONFIRM}`, { businessSlug, serviceId })}?${confirmSearch.toString()}`,
    );
  };

  return {
    canContinue: Boolean(selectedSlotStartsAt) && !errorView,
    canGoToNextWeek: Boolean(
      today &&
      shownWeekStart &&
      addCalendarDays(shownWeekStart, AVAILABILITY.DAYS_PER_WEEK) <=
        readLastBookableDay(today),
    ),
    canGoToPreviousWeek: Boolean(
      today && shownWeekStart && shownWeekStart > today,
    ),
    errorView,
    handleBackToServices: (): void => {
      void navigate(
        generatePath(
          `${ROUTE_PATH.CUSTOMER.ROOT}/${ROUTE_PATH.CUSTOMER.BOOK}`,
          { businessSlug },
        ),
      );
    },
    handleContinue,
    handleNextWeek: (): void => moveWeek(1),
    handlePreviousWeek: (): void => moveWeek(-1),
    handleRetry: (): void => {
      void failedQuery?.refetch();
    },
    handleSelectDate,
    handleSelectSlot: setSelectedSlotStartsAt,
    isEmptyDay: dayQuery.isSuccess && dayQuery.data.slots.length === 0,
    isLoading:
      contextQuery.isPending ||
      (!dateParam && firstDateQuery.isPending && Boolean(context)),
    isLoadingSlots: dayQuery.isFetching,
    language: i18n.language,
    selectedDate,
    selectedSlotStartsAt,
    serviceName: context?.serviceName ?? STRING.EMPTY,
    slots: dayQuery.data?.slots ?? [],
    timeZone: dayQuery.data?.timeZone ?? context?.timeZone ?? STRING.EMPTY,
    weekDays,
  };
};
