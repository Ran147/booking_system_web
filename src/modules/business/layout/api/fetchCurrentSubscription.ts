import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION } from "@/constants";
import { SUBSCRIPTION_STATUS, type SubscriptionStatus } from "@/domain";
import { firestore } from "@/services/firebase";
import type { Nullable } from "@/types";
import { BUSINESS_LAYOUT_CONSTANTS } from "../constants";
import { parseSubscriptionDate } from "../utils/subscriptionDates";

export interface CurrentSubscriptionData {
  readonly cancelAtPeriodEnd: boolean;
  readonly currentPeriodEndsAt: Nullable<Date>;
  readonly planId: string;
  readonly status: SubscriptionStatus;
}

const subscriptionDateSchema = z
  .unknown()
  .optional()
  .transform((value): Nullable<Date> => {
    if (!value) {
      return null;
    }
    const parsedDate = parseSubscriptionDate(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  });

const currentSubscriptionDocumentSchema = z.object({
  cancelAtPeriodEnd: z.boolean().optional().default(false),
  currentPeriodEndsAt: subscriptionDateSchema.default(null),
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
    BUSINESS_LAYOUT_CONSTANTS.CURRENT_DOCUMENT_ID,
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
