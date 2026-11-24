import type { QueryKey } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants";
import type { Nullable } from "@/types";
import { AVAILABILITY } from "../constants/Availability.constants";
import type { AvailabilityQueryParams } from "../models/availability.model";

export const availabilityQueryKeys = {
  all: (): QueryKey => [AVAILABILITY.QUERY_KEY_ROOT] as const,
  bookingContext: (businessSlug: string, serviceId: string): QueryKey =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessSlug,
      FIRESTORE_COLLECTION.SERVICES,
      serviceId,
    ] as const,
  day: ({
    businessId,
    collaboratorId,
    date,
    serviceId,
  }: AvailabilityQueryParams): QueryKey =>
    [
      ...availabilityQueryKeys.all(),
      businessId,
      serviceId,
      collaboratorId,
      date,
    ] as const,
  firstAvailableDate: (
    businessId: string,
    serviceId: string,
    collaboratorId: Nullable<string>,
  ): QueryKey =>
    [
      ...availabilityQueryKeys.all(),
      businessId,
      serviceId,
      collaboratorId,
      "first",
    ] as const,
};
