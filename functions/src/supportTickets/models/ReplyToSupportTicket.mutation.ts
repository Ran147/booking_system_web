export interface ReplyToSupportTicketPayload {
  readonly body: string;
  readonly ticketId: string;
}

export interface ReplyToSupportTicketResponse {
  readonly reply: {
    readonly body: string;
    readonly emailFailed: boolean;
    readonly id: string;
    readonly sentAt: string;
    readonly sentByEmail: string;
    readonly sentByUserId: string;
  };
  readonly status: string;
}
