import { useState } from "react";
import type { AuditLogEntry } from "@/domain";
import { useCursorPagination } from "@/hooks";
import type { Nullable } from "@/types";
import { useAuditLogEntriesQuery } from "../api";
import { AUDIT_LOG_DEFAULT_PAGE_SIZE } from "../constants";
import type { AuditLogViewModel } from "../models";

export const useAuditLogViewModel = (): AuditLogViewModel => {
  const [activeEntry, setActiveEntry] = useState<Nullable<AuditLogEntry>>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    currentCursor,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage,
    pageNumber,
  } = useCursorPagination([]);

  const queryResult = useAuditLogEntriesQuery({
    pageCursor: currentCursor,
    pageSize: AUDIT_LOG_DEFAULT_PAGE_SIZE,
  });

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

  return {
    activeEntry,
    closeModal,
    entries: queryResult.data?.items ?? [],
    hasNextPage: Boolean(queryResult.data?.nextCursor),
    hasPreviousPage,
    isError: queryResult.isError,
    isLoading: queryResult.isLoading,
    isModalOpen,
    nextPage,
    openModal,
    pageNumber,
    previousPage,
    refetch: (): void => {
      void queryResult.refetch();
    },
    totalCount: queryResult.data?.totalCount ?? 0,
  };
};
