import type { SupportTicket, SupportTicketStatus } from "@/domain";
import type { Nullable } from "@/types";

/**
 * Form values for creating a new support ticket.
 */
export interface CreateSupportTicketFormValues {
  readonly message: string;
  readonly subject: string;
}

/**
 * Contract for the Business Support ViewModel.
 */
export interface SupportTicketsViewModel {
  readonly closeCreateModal: () => void;
  readonly closeDetailDrawer: () => void;
  readonly formatDateTime: (dateOrString: Date | string) => string;
  readonly handleCreateTicket: (
    formValues: CreateSupportTicketFormValues,
  ) => Promise<void>;
  readonly isCreateModalOpen: boolean;
  readonly isCreating: boolean;
  readonly isDetailDrawerOpen: boolean;
  readonly isEmpty: boolean;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly openCreateModal: () => void;
  readonly openDetailDrawer: (ticket: SupportTicket) => void;
  readonly selectedTicket: Nullable<SupportTicket>;
  readonly tickets: readonly SupportTicket[];
  readonly totalCount: number;
}

/**
 * Props for the SupportTicketStatusBadge component.
 */
export interface SupportTicketStatusBadgeProps {
  readonly status: SupportTicketStatus;
}
