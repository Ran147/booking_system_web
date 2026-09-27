import type { TransitionMap } from "../stateMachine";

// "Cerrar" and "marcar como resuelto" (KAN-192) are the same transition.
// There is no reopen in the backlog.
export const SUPPORT_TICKET_STATUS = {
  IN_PROGRESS: "in_progress",
  OPEN: "open",
  RESOLVED: "resolved",
} as const;

export type SupportTicketStatus =
  (typeof SUPPORT_TICKET_STATUS)[keyof typeof SUPPORT_TICKET_STATUS];

export const SUPPORT_TICKET_STATUS_TRANSITIONS: TransitionMap<SupportTicketStatus> =
  {
    [SUPPORT_TICKET_STATUS.IN_PROGRESS]: [SUPPORT_TICKET_STATUS.RESOLVED],
    [SUPPORT_TICKET_STATUS.OPEN]: [
      SUPPORT_TICKET_STATUS.IN_PROGRESS,
      SUPPORT_TICKET_STATUS.RESOLVED,
    ],
    [SUPPORT_TICKET_STATUS.RESOLVED]: [],
  };
