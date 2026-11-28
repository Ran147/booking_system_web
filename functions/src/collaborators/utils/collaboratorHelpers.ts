import { createHash, randomBytes } from "node:crypto";
import type { Auth } from "firebase-admin/auth";
import type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  QuerySnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { readFirestoreDate } from "../../bookings/availability/utils/readFirestoreDate.js";
import { CallableFailure } from "../../shared/CallableFailure.js";
import { BUSINESS_STATUS } from "../../shared/constants/BusinessStatus.constants.js";
import { COLLABORATOR_STATUS } from "../../shared/constants/CollaboratorStatus.constants.js";
import { FIREBASE_AUTH_ERROR_CODE } from "../../shared/constants/FirebaseAuthErrorCode.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { LANGUAGE } from "../../shared/constants/Language.constants.js";
import { PLAN_STATUS } from "../../shared/constants/PlanStatus.constants.js";
import { SERVICE_STATUS } from "../../shared/constants/ServiceStatus.constants.js";
import { hasErrorCode } from "../../shared/hasErrorCode.js";
import type { Nullable } from "../../shared/types/Nullable.js";
import {
  COLLABORATOR_ERROR_REASON,
  COLLABORATOR_HANDLER_ERROR,
  COLLABORATOR_RULE_LIMIT,
} from "../constants/CollaboratorHandler.constants.js";

const DIACRITIC_PATTERN = /\p{Diacritic}/gu;

export const normalizeSearchTerm = (searchTerm: string): string =>
  searchTerm
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, "")
    .trim()
    .toLowerCase();

export const generateInvitationToken = (): string =>
  randomBytes(COLLABORATOR_RULE_LIMIT.INVITATION_TOKEN_BYTES).toString(
    "base64url",
  );

export const hashInvitationToken = (invitationToken: string): string =>
  createHash("sha256").update(invitationToken).digest("hex");

export const deduplicateStrings = <Value extends string>(
  values: readonly Value[],
): Value[] => Array.from(new Set(values));

export const isAuthEmailTaken = async (
  auth: Auth,
  email: string,
): Promise<boolean> => {
  try {
    await auth.getUserByEmail(email);
    return true;
  } catch (error) {
    if (hasErrorCode(error, FIREBASE_AUTH_ERROR_CODE.USER_NOT_FOUND)) {
      return false;
    }
    throw error;
  }
};

export const assertBusinessIsActive = async (
  businessReference: DocumentReference<DocumentData>,
): Promise<DocumentData> => {
  const businessSnapshot = await businessReference.get();
  const businessData = businessSnapshot.data();
  if (
    !businessSnapshot.exists ||
    businessData?.status !== BUSINESS_STATUS.ACTIVE
  ) {
    throw new CallableFailure(
      "failed-precondition",
      COLLABORATOR_HANDLER_ERROR.BUSINESS_NOT_ACTIVE,
      { reason: COLLABORATOR_ERROR_REASON.BUSINESS_NOT_ACTIVE },
    );
  }
  return businessData;
};

export const assertServicesAreActive = async (
  businessReference: DocumentReference<DocumentData>,
  serviceIds: readonly string[],
  transaction?: Transaction,
): Promise<void> => {
  if (serviceIds.length === 0) {
    return;
  }

  const servicesCollection = businessReference.collection(
    FIRESTORE_COLLECTION.SERVICES,
  );
  const serviceSnapshots = await Promise.all(
    serviceIds.map((serviceId) => {
      const serviceReference = servicesCollection.doc(serviceId);
      return transaction
        ? transaction.get(serviceReference)
        : serviceReference.get();
    }),
  );

  const hasInvalidService = serviceSnapshots.some(
    (snapshot) =>
      !snapshot.exists || snapshot.data()?.status !== SERVICE_STATUS.ACTIVE,
  );

  if (hasInvalidService) {
    throw new CallableFailure(
      "invalid-argument",
      COLLABORATOR_HANDLER_ERROR.INVALID_SERVICE,
    );
  }
};

export const countUsedCollaborators = (
  collaboratorsSnapshot: QuerySnapshot<DocumentData>,
): number =>
  collaboratorsSnapshot.docs.filter((collaboratorDocument) => {
    const documentData = collaboratorDocument.data();
    if (documentData.is_owner) {
      return false;
    }
    return (
      documentData.status === COLLABORATOR_STATUS.ACTIVE ||
      documentData.status === COLLABORATOR_STATUS.INVITED
    );
  }).length;

export interface CollaboratorLimitSummary {
  readonly hasHigherPlan: boolean;
  readonly limit: Nullable<number>;
}

const readPlanMaxCollaborators = (
  planData: Nullable<DocumentData>,
): Nullable<number> => {
  const rawLimits = planData?.limits;
  if (typeof rawLimits !== "object" || rawLimits === null) {
    return null;
  }
  const maxCollaborators = (rawLimits as { maxCollaborators?: unknown })
    .maxCollaborators;
  return typeof maxCollaborators === "number" && maxCollaborators >= 0
    ? maxCollaborators
    : null;
};

export const readCollaboratorLimitSummary = async (
  firestore: Firestore,
  businessReference: DocumentReference<DocumentData>,
  businessData: DocumentData,
  transaction?: Transaction,
): Promise<CollaboratorLimitSummary> => {
  const subscriptionReference = businessReference
    .collection(FIRESTORE_COLLECTION.SUBSCRIPTION)
    .doc(COLLABORATOR_RULE_LIMIT.CURRENT_SUBSCRIPTION_ID);
  const subscriptionSnapshot = transaction
    ? await transaction.get(subscriptionReference)
    : await subscriptionReference.get();

  const subscriptionData = subscriptionSnapshot.data();
  const businessSubscription = businessData.subscription as
    | { planId?: string }
    | undefined;
  const planId = String(
    subscriptionData?.planId ||
      businessSubscription?.planId ||
      businessData.plan_id ||
      "",
  );

  if (!planId) {
    return { hasHigherPlan: false, limit: null };
  }

  const plansCollection = firestore.collection(FIRESTORE_COLLECTION.PLANS);
  const planReference = plansCollection.doc(planId);
  const activePlansQuery = plansCollection.where(
    "status",
    "==",
    PLAN_STATUS.ACTIVE,
  );

  const [planSnapshot, activePlansSnapshot] = await Promise.all([
    transaction ? transaction.get(planReference) : planReference.get(),
    transaction ? transaction.get(activePlansQuery) : activePlansQuery.get(),
  ]);

  if (!planSnapshot.exists) {
    return { hasHigherPlan: false, limit: null };
  }

  const limit = readPlanMaxCollaborators(planSnapshot.data() ?? null);
  if (limit === null) {
    return { hasHigherPlan: false, limit: null };
  }

  const hasHigherPlan = activePlansSnapshot.docs.some((activePlanDocument) => {
    const otherLimit = readPlanMaxCollaborators(activePlanDocument.data());
    return otherLimit !== null && otherLimit > limit;
  });

  return { hasHigherPlan, limit };
};

export const assertWithinCollaboratorLimit = async (
  firestore: Firestore,
  businessReference: DocumentReference<DocumentData>,
  businessData: DocumentData,
  collaboratorsSnapshot: QuerySnapshot<DocumentData>,
  transaction?: Transaction,
): Promise<void> => {
  const { hasHigherPlan, limit } = await readCollaboratorLimitSummary(
    firestore,
    businessReference,
    businessData,
    transaction,
  );
  if (limit === null) {
    return;
  }

  const usedCount = countUsedCollaborators(collaboratorsSnapshot);
  if (usedCount >= limit) {
    throw new CallableFailure(
      "resource-exhausted",
      COLLABORATOR_HANDLER_ERROR.LIMIT_REACHED,
      {
        hasHigherPlan,
        limit,
        reason: COLLABORATOR_ERROR_REASON.LIMIT_REACHED,
      },
    );
  }
};

export const readSubscriberLanguage = async (
  firestore: Firestore,
  callerUserId: string,
): Promise<string> => {
  if (!callerUserId) {
    return LANGUAGE.ES;
  }
  const userSnapshot = await firestore
    .collection(FIRESTORE_COLLECTION.USERS)
    .doc(callerUserId)
    .get();
  const savedLanguage = userSnapshot.data()?.language;
  return savedLanguage === LANGUAGE.EN ? LANGUAGE.EN : LANGUAGE.ES;
};

export const invalidatePendingInvitations = async (
  firestore: Firestore,
  collaboratorId: string,
  now: Date,
  transaction?: Transaction,
): Promise<void> => {
  const invitationsQuery = firestore
    .collection(FIRESTORE_COLLECTION.COLLABORATOR_INVITATIONS)
    .where("collaboratorId", "==", collaboratorId)
    .where("usedAt", "==", null);

  const invitationsSnapshot = transaction
    ? await transaction.get(invitationsQuery)
    : await invitationsQuery.get();

  for (const invitationDocument of invitationsSnapshot.docs) {
    const invitationData = invitationDocument.data();
    if (!invitationData.invalidatedAt) {
      if (transaction) {
        transaction.update(invitationDocument.ref, { invalidatedAt: now });
      } else {
        await invitationDocument.ref.update({ invalidatedAt: now });
      }
    }
  }
};

export const buildInvitationDocument = ({
  businessId,
  businessName,
  collaboratorId,
  email,
  language,
  now,
}: {
  readonly businessId: string;
  readonly businessName: string;
  readonly collaboratorId: string;
  readonly email: string;
  readonly language: string;
  readonly now: Date;
}): Record<string, unknown> => ({
  businessId,
  businessName,
  collaboratorId,
  createdAt: now,
  email,
  expiresAt: new Date(
    now.getTime() + COLLABORATOR_RULE_LIMIT.INVITATION_EXPIRY_MS,
  ),
  invalidatedAt: null,
  language,
  usedAt: null,
});

export const readTimestampMillis = (value: unknown): Nullable<number> => {
  if (!value) {
    return null;
  }
  const parsedDate = readFirestoreDate(value);
  const millis = parsedDate.getTime();
  return Number.isNaN(millis) ? null : millis;
};

export const assertNonOwnerCollaboratorExists = (
  collaboratorSnapshot: DocumentSnapshot<DocumentData>,
): DocumentData => {
  const collaboratorData = collaboratorSnapshot.data();
  if (!collaboratorSnapshot.exists || !collaboratorData || collaboratorData.is_owner) {
    throw new CallableFailure(
      "not-found",
      COLLABORATOR_HANDLER_ERROR.NOT_FOUND,
      { reason: COLLABORATOR_ERROR_REASON.NOT_FOUND },
    );
  }
  return collaboratorData;
};
