import type { SupportTicket } from "@/domain";
import type { Nullable } from "@/types";

export interface SupportTicketDetailDrawerProps {
  readonly formatDateTime: (dateOrString: Date | string) => string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly ticket: Nullable<SupportTicket>;
}
