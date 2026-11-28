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
    restrictedCollaboratorId?: Nullable<string>,
  ) =>
    [
      ...scheduleQueryKeys.all,
      "history",
      businessId,
      {
        ...filters,
        page,
        restrictedCollaboratorId: restrictedCollaboratorId ?? null,
      },
    ] as const,
  hours: (businessId: string) =>
    [...scheduleQueryKeys.all, "hours", businessId] as const,
  upcoming: (
    businessId: string,
    page: number,
    restrictedCollaboratorId?: Nullable<string>,
  ) =>
    [
      ...scheduleQueryKeys.all,
      "upcoming",
      businessId,
      { page, restrictedCollaboratorId: restrictedCollaboratorId ?? null },
    ] as const,
});
