import type { Nullable } from "@/types";
import type { BookingHistoryFilterValues } from "../models";

export const scheduleQueryKeys = Object.freeze({
  all: ["business", "schedule"] as const,
  agenda: (
    businessId: string,
    periodStart: string,
    periodEnd: string,
    collaboratorId?: Nullable<string>,
  ) =>
    [
      ...scheduleQueryKeys.all,
      "agenda",
      businessId,
      { collaboratorId: collaboratorId ?? null, periodEnd, periodStart },
    ] as const,
  blocks: (businessId: string) =>
    [...scheduleQueryKeys.all, "blocks", businessId] as const,
  confirmationMode: (businessId: string) =>
    [...scheduleQueryKeys.all, "confirmationMode", businessId] as const,
  detail: (businessId: string, bookingId: string) =>
    [...scheduleQueryKeys.all, "detail", businessId, bookingId] as const,
  history: (
    businessId: string,
    filters: BookingHistoryFilterValues,
    page: number,
  ) =>
    [
      ...scheduleQueryKeys.all,
      "history",
      businessId,
      { ...filters, page },
    ] as const,
  hours: (businessId: string) =>
    [...scheduleQueryKeys.all, "hours", businessId] as const,
  upcoming: (businessId: string, page: number) =>
    [...scheduleQueryKeys.all, "upcoming", businessId, { page }] as const,
});
