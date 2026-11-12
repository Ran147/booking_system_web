import { useState } from "react";
import { useSearchParams } from "react-router";
import type { AuditLogEntry } from "@/domain";
import { useCursorPagination } from "@/hooks";
import type { Nullable } from "@/types";
import { useAuditLogEntriesQuery } from "../api";
import { AUDIT_LOG_DEFAULT_PAGE_SIZE } from "../constants";
import type { AuditLogFilters, AuditLogViewModel } from "../models";
import {
  buildAuditLogSearchParams,
  EMPTY_AUDIT_LOG_FILTERS,
  hasActiveAuditLogFilters,
  isAuditLogDateRangeInvalid,
  readAuditLogFilters,
} from "../utils";

const DEFAULT_TIME_ZONE = "UTC";

export const useAuditLogViewModel = (): AuditLogViewModel => {
  const [activeEntry, setActiveEntry] = useState<Nullable<AuditLogEntry>>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParameters, setSearchParameters] = useSearchParams();

  const { filters, isUnknownActionTypeInUrl } =
    readAuditLogFilters(searchParameters);
  const isDateRangeInvalid = isAuditLogDateRangeInvalid(
    filters.from,
    filters.to,
  );
  const hasActiveFilters = hasActiveAuditLogFilters(filters);

  const {
    currentCursor,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage,
    pageNumber,
  } = useCursorPagination([filters.actionType, filters.from, filters.to]);

  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;

  const queryResult = useAuditLogEntriesQuery(
    {
      filters,
      pageCursor: currentCursor,
      pageSize: AUDIT_LOG_DEFAULT_PAGE_SIZE,
      timeZone,
    },
    {
      enabled: !isDateRangeInvalid,
    },
  );

  const openModal = (entry: AuditLogEntry): void => {
    setActiveEntry(entry);
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setActiveEntry(null);
  };

  const nextPage = (): void => {
    if (queryResult.data?.nextCursor) {
      goToNextPage(queryResult.data.nextCursor);
    }
  };

  const previousPage = (): void => {
    goToPreviousPage();
  };

  const handleFilterChange = (newFilters: Partial<AuditLogFilters>): void => {
    const updatedFilters: AuditLogFilters = {
      ...filters,
      ...newFilters,
    };
    setSearchParameters(buildAuditLogSearchParams(updatedFilters));
  };

  const handleClearFilters = (): void => {
    setSearchParameters(buildAuditLogSearchParams(EMPTY_AUDIT_LOG_FILTERS));
  };

  return {
    activeEntry,
    closeModal,
    entries: isDateRangeInvalid ? [] : (queryResult.data?.items ?? []),
    filters,
    handleClearFilters,
    handleFilterChange,
    hasActiveFilters,
    hasNextPage: Boolean(queryResult.data?.nextCursor),
    hasPreviousPage,
    isDateRangeInvalid,
    isError: queryResult.isError,
    isLoading: isDateRangeInvalid ? false : queryResult.isLoading,
    isModalOpen,
    isUnknownActionTypeInUrl,
    nextPage,
    openModal,
    pageNumber,
    previousPage,
    refetch: (): void => {
      void queryResult.refetch();
    },
    totalCount: isDateRangeInvalid ? 0 : (queryResult.data?.totalCount ?? 0),
  };
};
