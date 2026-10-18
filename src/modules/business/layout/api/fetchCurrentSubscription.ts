import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION } from "@/constants";
import { SUBSCRIPTION_STATUS, type SubscriptionStatus } from "@/domain";
import { firestore } from "@/services/firebase";
import type { Nullable } from "@/types";

export interface CurrentSubscriptionData {
  readonly cancelAtPeriodEnd: boolean;
  readonly currentPeriodEndsAt: unknown;
  readonly planId: string;
  readonly status: SubscriptionStatus;
}

const currentSubscriptionDocumentSchema = z.object({
  cancelAtPeriodEnd: z.boolean().optional().default(false),
  currentPeriodEndsAt: z.unknown().optional(),
  planId: z.string().optional().default(""),
  status: z
    .enum([
      SUBSCRIPTION_STATUS.ACTIVE,
      SUBSCRIPTION_STATUS.CANCELLED,
      SUBSCRIPTION_STATUS.EXPIRED,
      SUBSCRIPTION_STATUS.PAST_DUE,
    ])
    .optional()
    .default(SUBSCRIPTION_STATUS.ACTIVE),
});

export const fetchCurrentSubscription = async (
  businessId: string,
): Promise<Nullable<CurrentSubscriptionData>> => {
  const subscriptionDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SUBSCRIPTION,
    "current",
  );
  const documentSnapshot = await getDoc(subscriptionDocumentReference);

  if (!documentSnapshot.exists()) {
    return null;
  }

  const documentData = currentSubscriptionDocumentSchema.parse(
    documentSnapshot.data() ?? {},
  );

  return {
    cancelAtPeriodEnd: documentData.cancelAtPeriodEnd,
    currentPeriodEndsAt: documentData.currentPeriodEndsAt,
    planId: documentData.planId,
    status: documentData.status,
  };
};
