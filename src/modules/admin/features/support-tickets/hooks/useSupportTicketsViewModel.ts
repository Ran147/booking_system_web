import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  SUPPORT_TICKET_STATUS,
  type SupportTicket,
  type SupportTicketReply,
  type SupportTicketStatus,
} from "@/domain";
import { useCursorPagination } from "@/hooks";
import type { Nullable } from "@/types";
import {
  useReplyToSupportTicketMutation,
  useResolveSupportTicketMutation,
  useSupportTicketsQuery,
} from "../api";
import {
  SUPPORT_TICKET_DEFAULT_PAGE_SIZE,
  SUPPORT_TICKET_QUERY_PARAM,
} from "../constants";
import type { SupportTicketsViewModel } from "../models";

const VALID_STATUSES: readonly string[] = Object.values(SUPPORT_TICKET_STATUS);

export const useSupportTicketsViewModel = (): SupportTicketsViewModel => {
  const [activeTicket, setActiveTicket] =
    useState<Nullable<SupportTicket>>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchParameters, setSearchParameters] = useSearchParams();

  const replyMutation = useReplyToSupportTicketMutation();
  const resolveMutation = useResolveSupportTicketMutation();

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
    setIsConfirmModalOpen(false);
    setActiveTicket(null);
  };

  const openConfirmModal = (): void => {
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = (): void => {
    setIsConfirmModalOpen(false);
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

  const handleReplyTicket = async (body: string): Promise<void> => {
    if (!activeTicket) {
      return;
    }

    try {
      const result = await replyMutation.mutateAsync({
        body,
        ticketId: activeTicket.id,
      });

      const newReplyItem: SupportTicketReply = {
        body: result.reply.body,
        emailFailed: result.reply.emailFailed,
        id: result.reply.id,
        sentAt: new Date(result.reply.sentAt),
        sentByEmail: result.reply.sentByEmail,
        sentByUserId: result.reply.sentByUserId,
      };

      setActiveTicket((previousTicket) => {
        if (!previousTicket) {
          return null;
        }
        return {
          ...previousTicket,
          replies: [...previousTicket.replies, newReplyItem],
          status: result.status as SupportTicketStatus,
          updatedAt: new Date(),
        };
      });
    } catch {
      // Handled by onError in mutation hook
    }
  };

  const handleResolveTicket = async (): Promise<void> => {
    if (!activeTicket) {
      return;
    }

    try {
      const result = await resolveMutation.mutateAsync({
        ticketId: activeTicket.id,
      });

      const resolvedDate = new Date(result.resolvedAt);

      setActiveTicket((previousTicket) => {
        if (!previousTicket) {
          return null;
        }
        return {
          ...previousTicket,
          resolvedAt: resolvedDate,
          status: SUPPORT_TICKET_STATUS.RESOLVED,
          updatedAt: resolvedDate,
        };
      });
    } catch {
      // Handled by onError in mutation hook
    } finally {
      setIsConfirmModalOpen(false);
    }
  };

  return {
    activeTicket,
    closeConfirmModal,
    closeDrawer,
    filterStatus,
    handleFilterStatusChange,
    handleReplyTicket,
    handleResolveTicket,
    hasNextPage: Boolean(queryResult.data?.nextCursor),
    hasPreviousPage,
    isConfirmModalOpen,
    isDrawerOpen,
    isError: queryResult.isError,
    isLoading: queryResult.isLoading,
    isReplying: replyMutation.isPending,
    isResolving: resolveMutation.isPending,
    nextPage,
    openConfirmModal,
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
