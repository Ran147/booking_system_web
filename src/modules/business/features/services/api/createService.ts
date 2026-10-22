import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FIRESTORE_COLLECTION, MONEY } from "@/constants";
import { SERVICE_STATUS } from "@/domain";
import { firestore } from "@/services/firebase";
import { normalizeSearchTerm } from "@/utils/normalizeSearchTerm";
import type {
  CreateServicePayload,
  CreateServiceResponse,
} from "../models/CreateService.mutation";

export const createService = async (
  payload: CreateServicePayload,
): Promise<CreateServiceResponse> => {
  const { businessId, formValues } = payload;
  const servicesCollectionReference = collection(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SERVICES,
  );

  const sanitizedFeatures = (formValues.features ?? [])
    .map((feature) => feature.trim())
    .filter((feature) => feature.length > 0);

  const priceInCents = Math.round(formValues.price * MONEY.CENTS_PER_UNIT);

  const documentReference = await addDoc(servicesCollectionReference, {
    createdAt: serverTimestamp(),
    description: formValues.description.trim(),
    durationMinutes: formValues.durationMinutes,
    features: sanitizedFeatures,
    imageUrl: formValues.imageUrl ?? null,
    name: formValues.name.trim(),
    priceInCents,
    searchName: normalizeSearchTerm(formValues.name),
    status: SERVICE_STATUS.ACTIVE,
    updatedAt: serverTimestamp(),
  });

  return {
    serviceId: documentReference.id,
  };
};
