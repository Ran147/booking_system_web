export interface CreateSupportTicketPayload {
  readonly businessId: string;
  readonly message: string;
  readonly subject: string;
}

export interface CreateSupportTicketResponse {
  readonly ticketId: string;
}
