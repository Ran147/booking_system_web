import type { SupportTicketStatus } from "@/domain";

export interface SupportTicketStatusBadgeProps {
  readonly className?: string;
  readonly status: SupportTicketStatus;
}
