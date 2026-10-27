import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { CURRENCY_CODE, FIRESTORE_COLLECTION } from "@/constants";
import { BUSINESS_STATUS, type BusinessStatus } from "@/domain";
import { firestore } from "@/services/firebase";
import { DEFAULT_SERVICE_LIST_CURRENCY } from "../constants/ServiceList.constants";

export interface BusinessInfo {
  readonly currency: string;
  readonly status: BusinessStatus;
  readonly timeZone?: string;
}

const businessInfoDocumentSchema = z.object({
  currency: z.string().optional().default(DEFAULT_SERVICE_LIST_CURRENCY),
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

export const fetchBusinessInfo = async (
  businessId: string,
): Promise<BusinessInfo> => {
  const businessDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
  );
  const documentSnapshot = await getDoc(businessDocumentReference);

  if (!documentSnapshot.exists()) {
    return {
      currency: DEFAULT_SERVICE_LIST_CURRENCY,
      status: BUSINESS_STATUS.ACTIVE,
      timeZone: "UTC",
    };
  }

  const documentData = businessInfoDocumentSchema.parse(
    documentSnapshot.data() ?? {},
  );

  const rawCurrency = documentData.currency;
  const normalizedCurrency =
    rawCurrency === CURRENCY_CODE.MXN
      ? DEFAULT_SERVICE_LIST_CURRENCY
      : rawCurrency;

  return {
    currency: normalizedCurrency,
    status: documentData.status,
    timeZone: documentData.timeZone,
  };
};
