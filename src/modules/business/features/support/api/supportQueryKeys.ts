export const supportQueryKeys = Object.freeze({
  all: (businessId: string) => ["businessSupportTickets", businessId] as const,
});
