import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import { BusinessGateDocumentSchema } from "./BusinessGateDocument.schema";
import { BUSINESS_GATE_ERROR } from "../constants/BusinessGateState.constants";
import type { BusinessGate } from "../models/businessStatusGate.model";

// businessId always comes from the session claim. A missing business is an
// error, never "active" (D-2, AC-KAN-33-12).
export const fetchBusinessGate = async (
  businessId: string,
): Promise<BusinessGate> => {
  const businessSnapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.BUSINESSES, businessId),
  );
  if (!businessSnapshot.exists()) {
    throw new Error(BUSINESS_GATE_ERROR.BUSINESS_NOT_FOUND);
  }

  const businessDocument = BusinessGateDocumentSchema.parse(
    businessSnapshot.data(),
  );

  return {
    name: businessDocument.name,
    rejectionReason: businessDocument.rejectionReason ?? null,
    signedUpAt: businessDocument.createdAt?.toDate() ?? null,
    status: businessDocument.status,
    timeZone: businessDocument.timeZone ?? null,
  };
};
