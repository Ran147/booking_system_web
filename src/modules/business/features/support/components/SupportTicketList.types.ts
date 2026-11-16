import type { SupportTicket } from "@/domain";

export interface SupportTicketListProps {
  readonly formatDateTime: (dateOrString: Date | string) => string;
  readonly isLoading: boolean;
  readonly onOpenCreateModal: () => void;
  readonly onSelectTicket: (ticket: SupportTicket) => void;
  readonly tickets: readonly SupportTicket[];
}
