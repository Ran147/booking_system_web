import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION, MONEY } from "@/constants";
import { firestore } from "@/services/firebase";
import { normalizeSearchTerm } from "@/utils/normalizeSearchTerm";
import type {
  UpdateServicePayload,
  UpdateServiceResponse,
} from "../models/UpdateService.mutation";

export const updateService = async (
  payload: UpdateServicePayload,
): Promise<UpdateServiceResponse> => {
  const { businessId, formValues, serviceId } = payload;
  const serviceDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SERVICES,
    serviceId,
  );

  const sanitizedFeatures = (formValues.features ?? [])
    .map((feature) => feature.trim())
    .filter((feature) => feature.length > 0);

  const priceInCents = Math.round(formValues.price * MONEY.CENTS_PER_UNIT);

  await updateDoc(serviceDocumentReference, {
    description: formValues.description.trim(),
    durationMinutes: formValues.durationMinutes,
    features: sanitizedFeatures,
    imageUrl: formValues.imageUrl ?? null,
    name: formValues.name.trim(),
    priceInCents,
    searchName: normalizeSearchTerm(formValues.name),
    updatedAt: serverTimestamp(),
  });

  return {
    serviceId,
  };
};
