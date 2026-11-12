import type { SupportTicket, SupportTicketStatus } from "@/domain";
import type { Nullable, PageCursor } from "@/types";

export interface SupportTicketDetailDrawerProps {
  readonly isConfirmModalOpen?: boolean;
  readonly isOpen: boolean;
  readonly isReplying?: boolean;
  readonly isResolving?: boolean;
  readonly onClose: () => void;
  readonly onCloseConfirmModal?: () => void;
  readonly onOpenConfirmModal?: () => void;
  readonly onReply?: (body: string) => Promise<void>;
  readonly onResolve?: () => Promise<void>;
  readonly ticket: Nullable<SupportTicket>;
}

export interface SupportTicketFilterBarProps {
  readonly onStatusChange: (status: Nullable<SupportTicketStatus>) => void;
  readonly selectedStatus: Nullable<SupportTicketStatus>;
}

export interface SupportTicketReplyFormProps {
  readonly isResolved: boolean;
  readonly isSubmitting: boolean;
  readonly onSubmitReply: (body: string) => Promise<void>;
}

export interface SupportTicketTableProps {
  readonly onSelectTicket: (ticket: SupportTicket) => void;
  readonly tickets: readonly SupportTicket[];
}

export interface SupportTicketsFilters {
  readonly status: Nullable<SupportTicketStatus>;
}

export interface SupportTicketsQueryParams {
  readonly filters?: SupportTicketsFilters;
  readonly pageCursor?: Nullable<PageCursor>;
  readonly pageSize?: number;
}

export interface SupportTicketsViewModel {
  readonly activeTicket: Nullable<SupportTicket>;
  readonly closeConfirmModal: () => void;
  readonly closeDrawer: () => void;
  readonly filterStatus: Nullable<SupportTicketStatus>;
  readonly handleFilterStatusChange: (
    status: Nullable<SupportTicketStatus>,
  ) => void;
  readonly handleReplyTicket: (body: string) => Promise<void>;
  readonly handleResolveTicket: () => Promise<void>;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly isConfirmModalOpen: boolean;
  readonly isDrawerOpen: boolean;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly isReplying: boolean;
  readonly isResolving: boolean;
  readonly nextPage: () => void;
  readonly openConfirmModal: () => void;
  readonly openDrawer: (ticket: SupportTicket) => void;
  readonly pageNumber: number;
  readonly previousPage: () => void;
  readonly refetch: () => void;
  readonly tickets: SupportTicket[];
  readonly totalCount: number;
}
