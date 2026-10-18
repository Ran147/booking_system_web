import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION } from "@/constants";
import { BUSINESS_STATUS, type BusinessStatus } from "@/domain";
import { firestore } from "@/services/firebase";
import type { Nullable } from "@/types";

export interface BusinessProfileData {
  readonly logoUrl: Nullable<string>;
  readonly name: string;
  readonly status: BusinessStatus;
  readonly timeZone: string;
}

const businessProfileDocumentSchema = z.object({
  logoUrl: z.string().nullable().optional().default(null),
  name: z.string().optional().default(""),
  status: z
    .enum([
      BUSINESS_STATUS.ACTIVE,
      BUSINESS_STATUS.INACTIVE,
      BUSINESS_STATUS.PENDING,
      BUSINESS_STATUS.REJECTED,
      BUSINESS_STATUS.SUSPENDED,
    ])
    .optional()
    .default(BUSINESS_STATUS.ACTIVE),
  timeZone: z.string().optional().default("UTC"),
});

export const fetchBusinessProfile = async (
  businessId: string,
): Promise<BusinessProfileData> => {
  const businessDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
  );
  const documentSnapshot = await getDoc(businessDocumentReference);

  if (!documentSnapshot.exists()) {
    return {
      logoUrl: null,
      name: "",
      status: BUSINESS_STATUS.ACTIVE,
      timeZone: "UTC",
    };
  }

  const documentData = businessProfileDocumentSchema.parse(
    documentSnapshot.data() ?? {},
  );

  return {
    logoUrl: documentData.logoUrl,
    name: documentData.name,
    status: documentData.status,
    timeZone: documentData.timeZone,
  };
};
