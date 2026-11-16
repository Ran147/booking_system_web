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
  const subscriptionRef = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SUBSCRIPTION,
    COLLABORATOR_RULE.CURRENT_SUBSCRIPTION_ID,
  );
  const businessRef = doc(
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

  const [subscriptionSnap, businessSnap, collaboratorsSnap] = await Promise.all(
    [
      getDoc(subscriptionRef),
      getDoc(businessRef),
      getDocs(collaboratorsCollection),
    ],
  );

  const used = collaboratorsSnap.docs.filter((docSnapshot) => {
    const parsed = collaboratorDocumentSchema.parse(docSnapshot.data() ?? {});
    if (parsed.is_owner) {
      return false;
    }
    return (
      parsed.status === COLLABORATOR_STATUS.ACTIVE ||
      parsed.status === COLLABORATOR_STATUS.INVITED
    );
  }).length;

  const businessFallback = businessPlanFallbackSchema.parse(
    businessSnap.data() ?? {},
  );
  const isReadOnly =
    businessSnap.exists() &&
    Boolean(businessFallback.status) &&
    businessFallback.status !== BUSINESS_STATUS.ACTIVE;
  const planId = subscriptionSnap.exists()
    ? subscriptionDocumentSchema.parse(subscriptionSnap.data() ?? {}).planId
    : (businessFallback.subscription?.planId ?? businessFallback.plan_id ?? "");

  if (!planId) {
    return { hasHigherPlan: false, isReadOnly, limit: null, used };
  }

  const planSnap = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.PLANS, planId),
  );
  if (!planSnap.exists()) {
    return { hasHigherPlan: false, isReadOnly, limit: null, used };
  }

  const currentLimit =
    planLimitsSchema.parse(planSnap.data() ?? {}).limits?.maxCollaborators ??
    null;

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
  const activePlansSnap = await getDocs(activePlansQuery);
  const hasHigherPlan = activePlansSnap.docs.some((activePlanDoc) => {
    const otherLimit =
      planLimitsSchema.parse(activePlanDoc.data() ?? {}).limits
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
