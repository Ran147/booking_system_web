import { doc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import type {
  UpdateServiceDiscountsPayload,
  UpdateServiceDiscountsResponse,
} from "../models/UpdateServiceDiscounts.mutation";

export const updateServiceDiscounts = async (
  payload: UpdateServiceDiscountsPayload,
): Promise<UpdateServiceDiscountsResponse> => {
  const { businessId, discounts, serviceId } = payload;
  const serviceDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SERVICES,
    serviceId,
  );

  const formattedDiscounts = discounts.map((discount) => ({
    endsAt:
      discount.endsAt instanceof Date
        ? Timestamp.fromDate(discount.endsAt)
        : discount.endsAt,
    startsAt:
      discount.startsAt instanceof Date
        ? Timestamp.fromDate(discount.startsAt)
        : discount.startsAt,
    type: discount.type,
    value: discount.value,
  }));

  await updateDoc(serviceDocumentReference, {
    discounts: formattedDiscounts,
    updatedAt: serverTimestamp(),
  });

  return {
    serviceId,
  };
};
