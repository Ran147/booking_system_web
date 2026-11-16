export const SUPPORT_TICKET_STATUS = Object.freeze({
  IN_PROGRESS: "in_progress",
  OPEN: "open",
  RESOLVED: "resolved",
} as const);

export type SupportTicketStatus =
  (typeof SUPPORT_TICKET_STATUS)[keyof typeof SUPPORT_TICKET_STATUS];
