import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION, FIRESTORE_OPERATOR } from "@/constants";
import { BUSINESS_STATUS, COLLABORATOR_STATUS, PLAN_STATUS } from "@/domain";
import { firestore } from "@/services/firebase";
import { collaboratorDocumentSchema } from "./CollaboratorDocument.schema";
import {
  COLLABORATOR_FIELD,
  COLLABORATOR_RULE,
} from "../constants/CollaboratorFeature.constants";
import type { CollaboratorUsageSummary } from "../models";

const subscriptionDocumentSchema = z.object({
  planId: z.string().optional().default(""),
});

const businessPlanFallbackSchema = z.object({
  plan_id: z.string().optional(),
  status: z.string().optional(),
  subscription: z
    .object({
      planId: z.string().optional(),
    })
    .optional(),
});

const planLimitsSchema = z.object({
  limits: z
    .object({
      maxCollaborators: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export const fetchCollaboratorUsage = async (
  businessId: string,
): Promise<CollaboratorUsageSummary> => {
  const subscriptionDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SUBSCRIPTION,
    COLLABORATOR_RULE.CURRENT_SUBSCRIPTION_ID,
  );
  const businessDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
  );
  const collaboratorsCollection = collection(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.COLLABORATORS,
  );

  const [subscriptionSnapshot, businessSnapshot, collaboratorsSnapshot] =
    await Promise.all([
      getDoc(subscriptionDocumentReference),
      getDoc(businessDocumentReference),
      getDocs(collaboratorsCollection),
    ]);

  const used = collaboratorsSnapshot.docs.filter((documentSnapshot) => {
    const parsed = collaboratorDocumentSchema.parse(
      documentSnapshot.data() ?? {},
    );
    if (parsed.is_owner) {
      return false;
    }
    return (
      parsed.status === COLLABORATOR_STATUS.ACTIVE ||
      parsed.status === COLLABORATOR_STATUS.INVITED
    );
  }).length;

  const businessFallback = businessPlanFallbackSchema.parse(
    businessSnapshot.data() ?? {},
  );
  const isReadOnly =
    businessSnapshot.exists() &&
    Boolean(businessFallback.status) &&
    businessFallback.status !== BUSINESS_STATUS.ACTIVE;
  const planId = subscriptionSnapshot.exists()
    ? subscriptionDocumentSchema.parse(subscriptionSnapshot.data() ?? {}).planId
    : (businessFallback.subscription?.planId ?? businessFallback.plan_id ?? "");

  if (!planId) {
    return { hasHigherPlan: false, isReadOnly, limit: null, used };
  }

  const planSnapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.PLANS, planId),
  );
  if (!planSnapshot.exists()) {
    return { hasHigherPlan: false, isReadOnly, limit: null, used };
  }

  const currentLimit =
    planLimitsSchema.parse(planSnapshot.data() ?? {}).limits
      ?.maxCollaborators ?? null;

  if (currentLimit === null) {
    return { hasHigherPlan: false, isReadOnly, limit: null, used };
  }

  const activePlansQuery = query(
    collection(firestore, FIRESTORE_COLLECTION.PLANS),
    where(
      COLLABORATOR_FIELD.STATUS,
      FIRESTORE_OPERATOR.EQUAL,
      PLAN_STATUS.ACTIVE,
    ),
  );
  const activePlansSnapshot = await getDocs(activePlansQuery);
  const hasHigherPlan = activePlansSnapshot.docs.some((activePlanDocument) => {
    const otherLimit =
      planLimitsSchema.parse(activePlanDocument.data() ?? {}).limits
        ?.maxCollaborators ?? null;
    return typeof otherLimit === "number" && otherLimit > currentLimit;
  });

  return {
    hasHigherPlan,
    isReadOnly,
    limit: currentLimit,
    used,
  };
};
