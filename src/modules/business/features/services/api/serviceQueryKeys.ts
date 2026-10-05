import { FIRESTORE_COLLECTION } from "@/constants";

export const serviceQueryKeys = Object.freeze({
  all: (businessId: string): readonly [string, string, string] =>
    Object.freeze([
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SERVICES,
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
});
