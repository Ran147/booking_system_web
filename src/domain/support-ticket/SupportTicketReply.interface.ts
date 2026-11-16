export interface SupportTicketReply {
  readonly body: string;
  readonly emailFailed?: boolean;
  readonly id: string;
  readonly sentAt: Date;
  readonly sentByEmail: string;
  readonly sentByUserId: string;
}
