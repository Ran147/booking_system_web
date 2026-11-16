export interface ResolveSupportTicketPayload {
  readonly ticketId: string;
}

export interface ResolveSupportTicketResponse {
  readonly resolvedAt: string;
  readonly status: string;
  readonly ticketId: string;
}
