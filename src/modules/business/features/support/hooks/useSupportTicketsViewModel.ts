import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SupportTicket } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { formatDateTime as formatDateTimeUtil } from "@/utils";
import { useCreateSupportTicketMutation, useSupportTicketsQuery } from "../api";
import type {
  CreateSupportTicketFormValues,
  SupportTicketsViewModel,
} from "../models";

export const useSupportTicketsViewModel = (): SupportTicketsViewModel => {
  const { i18n } = useTranslation();
  const { businessId } = useCurrentBusiness();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] =
    useState<Nullable<SupportTicket>>(null);

  const ticketsQuery = useSupportTicketsQuery(businessId);
  const createMutation = useCreateSupportTicketMutation(businessId);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const formatDateTime = (dateOrString: Date | string): string => {
    const date =
      typeof dateOrString === "string" ? new Date(dateOrString) : dateOrString;
    return formatDateTimeUtil(date, timeZone, i18n.language);
  };

  const openCreateModal = (): void => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = (): void => {
    setIsCreateModalOpen(false);
  };

  const openDetailDrawer = (ticket: SupportTicket): void => {
    setSelectedTicket(ticket);
  };

  const closeDetailDrawer = (): void => {
    setSelectedTicket(null);
  };

  const handleCreateTicket = async (
    formValues: CreateSupportTicketFormValues,
  ): Promise<void> => {
    try {
      await createMutation.mutateAsync({
        businessId,
        message: formValues.message,
        subject: formValues.subject,
      });
      closeCreateModal();
    } catch {
      // Error is surfaced via mutation toast in useCreateSupportTicketMutation
    }
  };

  const tickets = ticketsQuery.data ?? [];

  return {
    closeCreateModal,
    closeDetailDrawer,
    formatDateTime,
    handleCreateTicket,
    isCreateModalOpen,
    isCreating: createMutation.isPending,
    isDetailDrawerOpen: Boolean(selectedTicket),
    isEmpty: !ticketsQuery.isLoading && tickets.length === 0,
    isError: ticketsQuery.isError,
    isLoading: ticketsQuery.isLoading,
    openCreateModal,
    openDetailDrawer,
    selectedTicket,
    tickets,
    totalCount: tickets.length,
  };
};
