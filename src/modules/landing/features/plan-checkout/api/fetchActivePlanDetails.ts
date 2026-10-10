import { collection, getDocs, query, where } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/shared/constants";
import { PLAN_STATUS } from "@/shared/domain";
import { firestore, mapFirebaseError } from "@/shared/lib/firebase";
import type { MutationError } from "@/shared/types";
import type { PlanDetail } from "../models/PlanDetail.interface";
import { planDocumentSchema } from "../models/PlanDocument.schema";

// Every active plan, cheapest first: the page shows one and offers the others
// (AC-KAN-21-03). Unlike the catalog it never falls back to sample plans, so
// a missing plan or a failed read is shown as such (AC-KAN-21-04 … 06).
export const fetchActivePlanDetails = async (): Promise<PlanDetail[]> => {
  try {
    const activePlansSnapshot = await getDocs(
      query(
        collection(firestore, FIRESTORE_COLLECTION.PLANS),
        where("status", "==", PLAN_STATUS.ACTIVE),
      ),
    );

    return activePlansSnapshot.docs
      .map((planSnapshot): PlanDetail => {
        const planDocument = planDocumentSchema.parse(planSnapshot.data());
        return {
          billingPeriod: planDocument.billingPeriod,
          features: planDocument.features,
          id: planSnapshot.id,
          limits: planDocument.limits,
          name: planDocument.name,
          priceInCents: planDocument.priceInCents,
        };
      })
      .sort(
        (firstPlan, secondPlan) =>
          firstPlan.priceInCents - secondPlan.priceInCents,
      );
  } catch (error) {
    const queryError: MutationError = mapFirebaseError(error);
    throw queryError;
  }
};
