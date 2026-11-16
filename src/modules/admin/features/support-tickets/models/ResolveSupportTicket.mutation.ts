export interface ResolveSupportTicketInput {
  readonly ticketId: string;
}

export interface ResolveSupportTicketOutput {
  readonly resolvedAt: string;
  readonly status: string;
  readonly ticketId: string;
}
