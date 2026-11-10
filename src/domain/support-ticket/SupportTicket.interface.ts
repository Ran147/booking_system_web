import type { Nullable } from "@/types";
import type { SupportTicketReply } from "./SupportTicketReply.interface";
import type { SupportTicketStatus } from "./SupportTicketStatus.constants";

export interface SupportTicket {
  readonly businessId: string;
  readonly businessName: string;
  readonly createdAt: Date;
  readonly createdByUserId: string;
  readonly id: string;
  readonly message: string;
  readonly ownerEmail: Nullable<string>;
  readonly replies: readonly SupportTicketReply[];
  readonly resolvedAt: Nullable<Date>;
  readonly status: SupportTicketStatus;
  readonly subject: string;
  readonly updatedAt: Date;
}
