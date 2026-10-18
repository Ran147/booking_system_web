import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";

const planDocumentSchema = z.object({
  name: z.string().optional().default(""),
});

export const fetchPlanName = async (planId: string): Promise<string> => {
  if (!planId) {
    return "";
  }

  const planDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.PLANS,
    planId,
  );
  const documentSnapshot = await getDoc(planDocumentReference);

  if (!documentSnapshot.exists()) {
    return "";
  }

  const documentData = planDocumentSchema.parse(documentSnapshot.data() ?? {});
  return documentData.name;
};
