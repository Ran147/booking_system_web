import { collection, getDocs, query, where } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/shared/constants";
import { PLAN_STATUS } from "@/shared/domain";
import { firestore } from "@/shared/lib/firebase";
import { PlanDocumentSchema } from "./PlanDocument.schema";
import type { Plan } from "../models/Plan.interface";

export const fetchActivePlans = async (): Promise<Plan[]> => {
  const plansCollectionReference = collection(
    firestore,
    FIRESTORE_COLLECTION.PLANS,
  );
  const activePlansQuery = query(
    plansCollectionReference,
    where("status", "==", PLAN_STATUS.ACTIVE),
  );

  const querySnapshot = await getDocs(activePlansQuery);

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
};
