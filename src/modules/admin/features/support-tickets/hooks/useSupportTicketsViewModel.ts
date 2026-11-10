import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  SUPPORT_TICKET_STATUS,
  type SupportTicket,
  type SupportTicketStatus,
} from "@/domain";
import { useCursorPagination } from "@/hooks";
import type { Nullable } from "@/types";
import { useSupportTicketsQuery } from "../api";
import {
  SUPPORT_TICKET_DEFAULT_PAGE_SIZE,
  SUPPORT_TICKET_QUERY_PARAM,
} from "../constants";
import type { SupportTicketsViewModel } from "../models";

const VALID_STATUSES: readonly string[] = Object.values(SUPPORT_TICKET_STATUS);

export const useSupportTicketsViewModel = (): SupportTicketsViewModel => {
  const [activeTicket, setActiveTicket] =
    useState<Nullable<SupportTicket>>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchParameters, setSearchParameters] = useSearchParams();

  const rawStatus = searchParameters.get(SUPPORT_TICKET_QUERY_PARAM.STATUS);
  const filterStatus: Nullable<SupportTicketStatus> =
    rawStatus && VALID_STATUSES.includes(rawStatus)
      ? (rawStatus as SupportTicketStatus)
      : null;

  const {
    currentCursor,
    goToNextPage,
    goToPreviousPage,
    hasPreviousPage,
    pageNumber,
  } = useCursorPagination([filterStatus]);

  const queryResult = useSupportTicketsQuery({
    filters: { status: filterStatus },
    pageCursor: currentCursor,
    pageSize: SUPPORT_TICKET_DEFAULT_PAGE_SIZE,
  });

  const openDrawer = (ticket: SupportTicket): void => {
    setActiveTicket(ticket);
    setIsDrawerOpen(true);
  };

  const closeDrawer = (): void => {
    setIsDrawerOpen(false);
    setActiveTicket(null);
  };

  const nextPage = (): void => {
    if (queryResult.data?.nextCursor) {
      goToNextPage(queryResult.data.nextCursor);
    }
  };

  const previousPage = (): void => {
    goToPreviousPage();
  };

  const handleFilterStatusChange = (
    status: Nullable<SupportTicketStatus>,
  ): void => {
    const nextParameters = new URLSearchParams(searchParameters);
    if (status) {
      nextParameters.set(SUPPORT_TICKET_QUERY_PARAM.STATUS, status);
    } else {
      nextParameters.delete(SUPPORT_TICKET_QUERY_PARAM.STATUS);
    }
    setSearchParameters(nextParameters);
  };

  return {
    activeTicket,
    closeDrawer,
    filterStatus,
    handleFilterStatusChange,
    hasNextPage: Boolean(queryResult.data?.nextCursor),
    hasPreviousPage,
    isDrawerOpen,
    isError: queryResult.isError,
    isLoading: queryResult.isLoading,
    nextPage,
    openDrawer,
    pageNumber,
    previousPage,
    refetch: (): void => {
      void queryResult.refetch();
    },
    tickets: queryResult.data?.items ?? [],
    totalCount: queryResult.data?.totalCount ?? 0,
  };
};
