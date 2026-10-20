import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import type { Nullable, NullableRef } from "@/shared/types";
import {
  useBookingBusinessesQueries,
  useCustomerBusinessIdsQuery,
} from "../api";
import {
  MY_BOOKINGS_QUERY_PARAM,
  MY_BOOKINGS_TAB,
  STATUS_FILTER_OPTIONS,
  type MyBookingsTab,
} from "../constants";
import type {
  BookingBusiness,
  MyBookingsFilters,
  MyBookingsFiltersViewModel,
} from "../models";
import {
  buildMyBookingsSearchParams,
  EMPTY_FILTERS,
  hasActiveFilters,
  isRangeInvalid,
  readMyBookingsFilters,
} from "../utils/myBookingsFilters";

const readTab = (rawTab: Nullable<string>): MyBookingsTab =>
  rawTab === MY_BOOKINGS_TAB.HISTORY
    ? MY_BOOKINGS_TAB.HISTORY
    : MY_BOOKINGS_TAB.UPCOMING;

// The tab and the filters live in the URL, so a reload or a shared link keeps
// them (AC-KAN-154-04).
export const useMyBookingsFilters = (
  customerUserId: string,
): MyBookingsFiltersViewModel => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = readTab(searchParams.get(MY_BOOKINGS_QUERY_PARAM.TAB));
  const filters = readMyBookingsFilters(searchParams, activeTab);

  const customerBusinessIds = useCustomerBusinessIdsQuery(customerUserId);
  const businessQueries = useBookingBusinessesQueries([
    ...(customerBusinessIds.data ?? []),
    ...(filters.businessId ? [filters.businessId] : []),
  ]);
  const businesses = businessQueries.flatMap((businessQuery) =>
    businessQuery.data ? [businessQuery.data] : [],
  );
  const selectedBusiness: NullableRef<BookingBusiness> =
    businesses.find((business) => business.id === filters.businessId) ?? null;

  const applyFilters = (
    tab: MyBookingsTab,
    nextFilters: MyBookingsFilters,
  ): void => {
    setSearchParams(buildMyBookingsSearchParams(tab, nextFilters));
  };

  return {
    activeTab,
    businessOptions: businesses.map((business) => ({
      label: business.name,
      value: business.id,
    })),
    filters,
    handleClearFilters: (): void => {
      applyFilters(activeTab, EMPTY_FILTERS);
    },
    handleFilterChange: (changedFilters): void => {
      applyFilters(activeTab, { ...filters, ...changedFilters });
    },
    handleStatusChange: (rawStatus: string): void => {
      applyFilters(activeTab, {
        ...filters,
        status:
          STATUS_FILTER_OPTIONS[activeTab].find(
            (status) => status === rawStatus,
          ) ?? null,
      });
    },
    handleTabChange: (tabId: string): void => {
      applyFilters(readTab(tabId), EMPTY_FILTERS);
    },
    hasActiveFilters: hasActiveFilters(filters),
    isRangeInvalid: isRangeInvalid(filters),
    selectedBusiness,
    statusOptions: STATUS_FILTER_OPTIONS[activeTab].map((status) => ({
      label: t(`bookingStatus.${status}`),
      value: status,
    })),
  };
};
