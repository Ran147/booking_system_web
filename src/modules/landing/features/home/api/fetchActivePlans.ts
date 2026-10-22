import { collection, getDocs, query, where } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { PLAN_STATUS } from "@/domain";
import { firestore } from "@/services/firebase";
import { PlanDocumentSchema } from "./PlanDocument.schema";
import { MOCK_PLANS } from "../constants/PlanCatalogMocks.constants";
import type { Plan } from "../models/Plan.interface";

export const fetchActivePlans = async (): Promise<Plan[]> => {
  if (!firestore || !("app" in firestore)) {
    return [...MOCK_PLANS];
  }

  try {
    const plansCollectionReference = collection(
      firestore,
      FIRESTORE_COLLECTION.PLANS,
    );
    const activePlansQuery = query(
      plansCollectionReference,
      where("status", "==", PLAN_STATUS.ACTIVE),
    );

    const querySnapshot = await getDocs(activePlansQuery);

    if (querySnapshot.empty) {
      return [...MOCK_PLANS];
    }

    return querySnapshot.docs.map((documentSnapshot) => {
      const parsedData = PlanDocumentSchema.parse(documentSnapshot.data());
      return {
        billingPeriod: parsedData.billingPeriod,
        features: parsedData.features,
        id: documentSnapshot.id,
        limits: parsedData.limits,
        name: parsedData.name,
        priceInCents: parsedData.priceInCents,
        status: parsedData.status,
      };
    });
  } catch {
    return [...MOCK_PLANS];
  }
};
