import type { QueryKey } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants";
import type { ServiceListQueryParams } from "../models/ServiceListQueryParams.interface";

export const serviceQueryKeys = Object.freeze({
  all: (businessId: string): readonly [string, string, string] =>
    Object.freeze([
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SERVICES,
    ] as const),
  collaborators: (
    businessId: string,
    serviceId: string,
  ): readonly [string, string, string, string, string] =>
    Object.freeze([
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SERVICES,
      serviceId,
      "collaborators",
    ] as const),
  detail: (
    businessId: string,
    serviceId: string,
  ): readonly [string, string, string, string] =>
    Object.freeze([
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SERVICES,
      serviceId,
    ] as const),
  list: ({
    businessId,
    filters,
    pageCursor,
    pageSize,
  }: ServiceListQueryParams): QueryKey => [
    ...serviceQueryKeys.all(businessId),
    filters,
    pageCursor?.id ?? null,
    pageSize,
  ],
});
