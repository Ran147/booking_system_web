import { FIRESTORE_COLLECTION } from "@/constants";
import type { CollaboratorListFilters } from "../models";

export const collaboratorQueryKeys = {
  activeServices: (businessId: string) =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SERVICES,
      "active-for-collaborators",
    ] as const,
  all: (businessId: string) =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.COLLABORATORS,
    ] as const,
  detail: (businessId: string, collaboratorId: string) =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.COLLABORATORS,
      "detail",
      collaboratorId,
    ] as const,
  list: (
    businessId: string,
    filters: CollaboratorListFilters,
    pageNumber: number,
  ) =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.COLLABORATORS,
      "list",
      filters.status,
      filters.searchTerm,
      pageNumber,
    ] as const,
  usage: (businessId: string) =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.COLLABORATORS,
      "usage",
    ] as const,
};
