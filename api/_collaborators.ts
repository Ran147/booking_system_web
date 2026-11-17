import { createHash, randomBytes } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { Auth } from "firebase-admin/auth";
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import type { Nullable, NullableUndefined } from "../src/types/Nullable";

const ACTIVE_RECORD_STATUS = "active";

export const COLLABORATOR_FUNCTION_NAME = Object.freeze({
  ACCEPT_COLLABORATOR_INVITATION: "acceptCollaboratorInvitation",
  REGISTER_COLLABORATOR: "registerCollaborator",
  RESEND_COLLABORATOR_EMAIL: "resendCollaboratorEmail",
  UPDATE_COLLABORATOR: "updateCollaborator",
  UPDATE_COLLABORATOR_PERMISSIONS: "updateCollaboratorPermissions",
  UPDATE_COLLABORATOR_STATUS: "updateCollaboratorStatus",
  VALIDATE_COLLABORATOR_INVITATION: "validateCollaboratorInvitation",
} as const);

const COLLABORATOR_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  INVITED: "invited",
} as const);

const COLLABORATOR_PERMISSION_VALUES = [
  "manage_bookings",
  "manage_customers",
  "manage_schedule_blocks",
  "manage_services",
  "view_reports",
] as const;

const COLLABORATOR_ERROR_REASON = Object.freeze({
  BUSINESS_NOT_ACTIVE: "business_not_active",
  CONCURRENT_MODIFICATION: "concurrent_modification",
  COOLDOWN_ACTIVE: "cooldown_active",
  EMAIL_ALREADY_IN_USE: "email_already_in_use",
  EMAIL_DISPATCH_FAILED: "email_dispatch_failed",
  INVALID_EMAIL_CHANGE_STATUS: "invalid_email_change_status",
  INVALID_INVITATION: "invalid_invitation",
  INVALID_PERMISSIONS: "invalid_permissions",
  INVALID_SERVICE_IDS: "invalid_service_ids",
  INVALID_STATUS_FOR_RESEND: "invalid_status_for_resend",
  INVALID_STATUS_TRANSITION: "invalid_status_transition",
  LIMIT_REACHED: "limit_reached",
  NOT_FOUND: "not_found",
  RECAPTCHA_INVALID: "recaptcha_invalid",
} as const);

const COLLABORATOR_RULE = Object.freeze({
  AUTH_USER_NOT_FOUND_CODE: "auth/user-not-found",
  AUTH_EMAIL_ALREADY_EXISTS_CODE: "auth/email-already-exists",
  BYTES_PER_TOKEN: 32,
  FULL_NAME_MAX_LENGTH: 80,
  FULL_NAME_MIN_LENGTH: 2,
  INVITATION_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  MS_PER_SECOND: 1000,
  PASSWORD_MIN_LENGTH: 8,
  RESEND_COOLDOWN_MS: 60 * 1000,
  SPECIALTY_MAX_LENGTH: 80,
} as const);

const HTTP_STATUS = Object.freeze({
  BAD_REQUEST: 400,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  NOT_FOUND: 404,
  OK: 200,
  PRECONDITION_FAILED: 412,
  TOO_MANY_REQUESTS: 429,
} as const);

const BOOKING_ACTIVE_STATUSES: readonly string[] = Object.freeze([
  "pending",
  "confirmed",
]);

const COLLABORATOR_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  [COLLABORATOR_STATUS.ACTIVE]: [COLLABORATOR_STATUS.INACTIVE],
  [COLLABORATOR_STATUS.INACTIVE]: [COLLABORATOR_STATUS.ACTIVE],
  [COLLABORATOR_STATUS.INVITED]: [],
};

const PHONE_PATTERN = /^(\+\d{1,3}[\s-]?)?(\d[\s-]?){7,15}\d$/;
const LOWERCASE_PATTERN = /[a-z]/;
const UPPERCASE_PATTERN = /[A-Z]/;
const DIGIT_PATTERN = /\d/;
const DIACRITIC_PATTERN = /\p{Diacritic}/gu;

const normalizeSearchTerm = (value: string): string =>
  value.normalize("NFD").replace(DIACRITIC_PATTERN, "").trim().toLowerCase();

const hashToken = (rawToken: string): string =>
  createHash("sha256").update(rawToken).digest("hex");

const createInvitationToken = (): { rawToken: string; tokenHash: string } => {
  const rawToken = randomBytes(COLLABORATOR_RULE.BYTES_PER_TOKEN).toString(
    "base64url",
  );
  return { rawToken, tokenHash: hashToken(rawToken) };
};

const toTimestamp = (date: Date): unknown => {
  if (
    typeof Timestamp !== "undefined" &&
    typeof Timestamp.fromDate === "function"
  ) {
    return Timestamp.fromDate(date);
  }
  return date;
};

const toDateMillis = (value: unknown): Nullable<number> => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "object") {
    const record = value as {
      milliseconds?: unknown;
      seconds?: unknown;
      toDate?: () => Date;
    };
    if (typeof record.toDate === "function") {
      return record.toDate().getTime();
    }
    if (typeof record.milliseconds === "number") {
      return record.milliseconds;
    }
    if (typeof record.seconds === "number") {
      return record.seconds * COLLABORATOR_RULE.MS_PER_SECOND;
    }
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const toIsoString = (value: unknown): Nullable<string> => {
  const millis = toDateMillis(value);
  return typeof millis === "number" ? new Date(millis).toISOString() : null;
};

const hasErrorCode = (error: unknown, expectedCode: string): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === expectedCode;

class CollaboratorActionError extends Error {
  public readonly details?: Record<string, unknown>;
  public readonly errorCode: string;
  public readonly httpStatus: number;

  public constructor(
    httpStatus: number,
    errorCode: string,
    reason: string,
    message: string,
    extraDetails?: Record<string, unknown>,
  ) {
    super(message);
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
    this.details = { reason, ...extraDetails };
  }
}

const sendJsonResponse = (
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
};

const sendCodedError = (
  response: ServerResponse,
  error: CollaboratorActionError,
): void => {
  sendJsonResponse(response, error.httpStatus, {
    details: error.details,
    error: error.errorCode,
    message: error.message,
  });
};

const registerCollaboratorPayloadSchema = z.object({
  businessId: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  fullName: z
    .string()
    .trim()
    .min(COLLABORATOR_RULE.FULL_NAME_MIN_LENGTH)
    .max(COLLABORATOR_RULE.FULL_NAME_MAX_LENGTH),
  permissions: z.array(z.enum(COLLABORATOR_PERMISSION_VALUES)).default([]),
  phone: z.string().trim().regex(PHONE_PATTERN),
  serviceIds: z.array(z.string().trim().min(1)).min(1),
  specialty: z
    .string()
    .trim()
    .max(COLLABORATOR_RULE.SPECIALTY_MAX_LENGTH)
    .nullable()
    .optional(),
});

const validateInvitationPayloadSchema = z.object({
  invitationToken: z.string().trim().min(1),
});

const acceptInvitationPayloadSchema = z.object({
  invitationToken: z.string().trim().min(1),
  password: z
    .string()
    .min(COLLABORATOR_RULE.PASSWORD_MIN_LENGTH)
    .regex(LOWERCASE_PATTERN)
    .regex(UPPERCASE_PATTERN)
    .regex(DIGIT_PATTERN),
  recaptchaToken: z.string().trim().min(1),
});

const updateCollaboratorPayloadSchema = z.object({
  businessId: z.string().trim().min(1),
  collaboratorId: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email().optional(),
  expectedUpdatedAt: z.string().trim().optional(),
  fullName: z
    .string()
    .trim()
    .min(COLLABORATOR_RULE.FULL_NAME_MIN_LENGTH)
    .max(COLLABORATOR_RULE.FULL_NAME_MAX_LENGTH),
  phone: z.string().trim().regex(PHONE_PATTERN),
  serviceIds: z.array(z.string().trim().min(1)).min(1),
  specialty: z
    .string()
    .trim()
    .max(COLLABORATOR_RULE.SPECIALTY_MAX_LENGTH)
    .nullable()
    .optional(),
});

const updateStatusPayloadSchema = z.object({
  businessId: z.string().trim().min(1),
  collaboratorId: z.string().trim().min(1),
  targetStatus: z.enum([
    COLLABORATOR_STATUS.ACTIVE,
    COLLABORATOR_STATUS.INACTIVE,
  ]),
});

const updatePermissionsPayloadSchema = z.object({
  businessId: z.string().trim().min(1),
  collaboratorId: z.string().trim().min(1),
  permissions: z.array(z.string().trim().min(1)),
});

const resendEmailPayloadSchema = z.object({
  businessId: z.string().trim().min(1),
  collaboratorId: z.string().trim().min(1),
});

interface PlanLimitInfo {
  readonly hasHigherPlan: boolean;
  readonly maxCollaborators: Nullable<number>;
}

const readPlanLimitInfo = async (
  firestore: Firestore,
  businessId: string,
  businessRecord: Record<string, unknown>,
): Promise<PlanLimitInfo> => {
  const subscriptionSnapshot = await firestore
    .collection("businesses")
    .doc(businessId)
    .collection("subscription")
    .doc("current")
    .get();

  const subscriptionRecord = subscriptionSnapshot.exists
    ? (subscriptionSnapshot.data() as Record<string, unknown>)
    : undefined;
  const embeddedSubscription =
    typeof businessRecord.subscription === "object" &&
    businessRecord.subscription !== null
      ? (businessRecord.subscription as Record<string, unknown>)
      : undefined;

  const rawPlanId =
    subscriptionRecord?.planId ??
    embeddedSubscription?.planId ??
    businessRecord.plan_id;
  const planId = typeof rawPlanId === "string" ? rawPlanId : "";

  if (!planId) {
    return { hasHigherPlan: false, maxCollaborators: null };
  }

  const planSnapshot = await firestore.collection("plans").doc(planId).get();
  if (!planSnapshot.exists) {
    return { hasHigherPlan: false, maxCollaborators: null };
  }

  const planRecord = planSnapshot.data() as Record<string, unknown>;
  const limitsRecord =
    typeof planRecord.limits === "object" && planRecord.limits !== null
      ? (planRecord.limits as Record<string, unknown>)
      : undefined;
  const maxCollaborators =
    typeof limitsRecord?.maxCollaborators === "number"
      ? limitsRecord.maxCollaborators
      : null;

  if (maxCollaborators === null) {
    return { hasHigherPlan: false, maxCollaborators: null };
  }

  const activePlansSnapshot = await firestore
    .collection("plans")
    .where("status", "==", "active")
    .get();

  const hasHigherPlan = activePlansSnapshot.docs.some((planDocument) => {
    const activePlanRecord = planDocument.data() as Record<string, unknown>;
    const activeLimits =
      typeof activePlanRecord.limits === "object" &&
      activePlanRecord.limits !== null
        ? (activePlanRecord.limits as Record<string, unknown>)
        : undefined;
    const otherLimit = activeLimits?.maxCollaborators;
    return typeof otherLimit === "number" && otherLimit > maxCollaborators;
  });

  return { hasHigherPlan, maxCollaborators };
};

const verifyAuthEmailAvailable = async (
  auth: Auth,
  email: string,
): Promise<void> => {
  try {
    await auth.getUserByEmail(email);
    throw new CollaboratorActionError(
      HTTP_STATUS.CONFLICT,
      "already-exists",
      COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE,
      "A user with this email already exists",
    );
  } catch (error) {
    if (error instanceof CollaboratorActionError) {
      throw error;
    }
    if (!hasErrorCode(error, COLLABORATOR_RULE.AUTH_USER_NOT_FOUND_CODE)) {
      throw error;
    }
  }
};

const verifyRecaptchaToken = async (token: string): Promise<boolean> => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    return token.trim().length > 0;
  }

  const verificationResponse = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      body: new URLSearchParams({
        response: token,
        secret: secretKey,
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    },
  );

  if (!verificationResponse.ok) {
    return false;
  }

  const parsedResponse = (await verificationResponse.json()) as {
    success?: boolean;
  };
  return Boolean(parsedResponse.success);
};

const FIREBASE_WEB_API_KEY_ENV_VARS = [
  "FIREBASE_WEB_API_KEY",
  "VITE_FIREBASE_API_KEY",
] as const;

const readWebApiKey = (): Nullable<string> => {
  for (const environmentVariable of FIREBASE_WEB_API_KEY_ENV_VARS) {
    const configuredKey = process.env[environmentVariable]?.trim();
    if (configuredKey) {
      return configuredKey;
    }
  }
  return null;
};

const sendPasswordResetViaIdentityToolkit = async (
  email: string,
  language: string,
): Promise<void> => {
  const apiKey = readWebApiKey();
  if (!apiKey) {
    throw new CollaboratorActionError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "internal",
      COLLABORATOR_ERROR_REASON.EMAIL_DISPATCH_FAILED,
      "FIREBASE_WEB_API_KEY is not set: the reset email cannot be requested",
    );
  }

  const identityResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`,
    {
      body: JSON.stringify({
        email,
        requestType: "PASSWORD_RESET",
      }),
      headers: {
        "Content-Type": "application/json",
        "X-Firebase-Locale": language || "es",
      },
      method: "POST",
    },
  );

  if (!identityResponse.ok) {
    throw new CollaboratorActionError(
      HTTP_STATUS.PRECONDITION_FAILED,
      "failed-precondition",
      COLLABORATOR_ERROR_REASON.EMAIL_DISPATCH_FAILED,
      "Could not send password reset email",
    );
  }
};

const handleRegisterCollaborator = async (
  payload: Record<string, unknown>,
  response: ServerResponse,
  auth: Auth,
  firestore: Firestore,
): Promise<void> => {
  const parsed = registerCollaboratorPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
      error: "invalid-argument",
      message: "Invalid collaborator registration payload",
    });
    return;
  }

  const input = parsed.data;
  const uniqueServiceIds = Array.from(new Set(input.serviceIds));
  const uniquePermissions = Array.from(new Set(input.permissions));

  const businessReference = firestore
    .collection("businesses")
    .doc(input.businessId);
  const businessSnapshot = await businessReference.get();
  if (
    !businessSnapshot.exists ||
    businessSnapshot.data()?.status !== ACTIVE_RECORD_STATUS
  ) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.BUSINESS_NOT_ACTIVE,
        "Business must be active to register collaborators",
      ),
    );
    return;
  }

  await verifyAuthEmailAvailable(auth, input.email);

  const limitInfo = await readPlanLimitInfo(
    firestore,
    input.businessId,
    businessSnapshot.data() as Record<string, unknown>,
  );

  const { rawToken, tokenHash } = createInvitationToken();
  const collaboratorsCollection = businessReference.collection("collaborators");
  const collaboratorReference = collaboratorsCollection.doc();
  const invitationReference = firestore
    .collection("collaboratorInvitations")
    .doc(tokenHash);

  await firestore.runTransaction(async (transaction) => {
    const existingCollaborators = await transaction.get(
      collaboratorsCollection,
    );

    let activeAndInvitedCount = 0;
    for (const collaboratorDocument of existingCollaborators.docs) {
      const record = collaboratorDocument.data() as Record<string, unknown>;
      if (record.is_owner === true) {
        continue;
      }
      const existingEmail =
        typeof record.email === "string"
          ? record.email.trim().toLowerCase()
          : "";
      if (existingEmail === input.email) {
        throw new CollaboratorActionError(
          HTTP_STATUS.CONFLICT,
          "already-exists",
          COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE,
          "A collaborator with this email already exists in the business",
        );
      }
      if (
        record.status === COLLABORATOR_STATUS.ACTIVE ||
        record.status === COLLABORATOR_STATUS.INVITED
      ) {
        activeAndInvitedCount += 1;
      }
    }

    if (
      typeof limitInfo.maxCollaborators === "number" &&
      activeAndInvitedCount >= limitInfo.maxCollaborators
    ) {
      throw new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.LIMIT_REACHED,
        "Collaborator plan limit reached",
        {
          hasHigherPlan: limitInfo.hasHigherPlan,
          limit: limitInfo.maxCollaborators,
        },
      );
    }

    const serviceSnapshots = await Promise.all(
      uniqueServiceIds.map((serviceId) =>
        transaction.get(
          businessReference.collection("services").doc(serviceId),
        ),
      ),
    );

    const hasInvalidService = serviceSnapshots.some(
      (serviceSnapshot) =>
        !serviceSnapshot.exists ||
        serviceSnapshot.data()?.status !== ACTIVE_RECORD_STATUS,
    );
    if (hasInvalidService) {
      throw new CollaboratorActionError(
        HTTP_STATUS.BAD_REQUEST,
        "invalid-argument",
        COLLABORATOR_ERROR_REASON.INVALID_SERVICE_IDS,
        "Selected services must exist and be active",
      );
    }

    const nowDate = new Date();
    const nowTimestamp = toTimestamp(nowDate);
    const expiresAtTimestamp = toTimestamp(
      new Date(nowDate.getTime() + COLLABORATOR_RULE.INVITATION_TTL_MS),
    );

    transaction.create(collaboratorReference, {
      businessId: input.businessId,
      createdAt: nowTimestamp,
      email: input.email,
      fullName: input.fullName,
      lastEmailSentAt: nowTimestamp,
      permissions: uniquePermissions,
      phone: input.phone,
      searchName: normalizeSearchTerm(input.fullName),
      serviceIds: uniqueServiceIds,
      specialty: input.specialty?.trim() || null,
      status: COLLABORATOR_STATUS.INVITED,
      updatedAt: nowTimestamp,
      userId: null,
    });

    transaction.create(invitationReference, {
      businessId: input.businessId,
      collaboratorId: collaboratorReference.id,
      createdAt: nowTimestamp,
      email: input.email,
      expiresAt: expiresAtTimestamp,
      usedAt: null,
    });
  });

  sendJsonResponse(response, HTTP_STATUS.OK, {
    collaboratorId: collaboratorReference.id,
    email: input.email,
    invitationToken: rawToken,
    status: COLLABORATOR_STATUS.INVITED,
  });
};

const handleValidateCollaboratorInvitation = async (
  payload: Record<string, unknown>,
  response: ServerResponse,
  firestore: Firestore,
): Promise<void> => {
  const parsed = validateInvitationPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.INVALID_INVITATION,
        "Invalid or expired invitation link",
      ),
    );
    return;
  }

  const tokenHash = hashToken(parsed.data.invitationToken);
  const invitationSnapshot = await firestore
    .collection("collaboratorInvitations")
    .doc(tokenHash)
    .get();

  if (!invitationSnapshot.exists) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.INVALID_INVITATION,
        "Invalid or expired invitation link",
      ),
    );
    return;
  }

  const invitationRecord = invitationSnapshot.data() as Record<string, unknown>;
  const expiresAtMillis = toDateMillis(invitationRecord.expiresAt);
  const businessId = String(invitationRecord.businessId || "");
  const collaboratorId = String(invitationRecord.collaboratorId || "");

  if (
    invitationRecord.usedAt !== null ||
    typeof expiresAtMillis !== "number" ||
    expiresAtMillis <= Date.now() ||
    !businessId ||
    !collaboratorId
  ) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.INVALID_INVITATION,
        "Invalid or expired invitation link",
      ),
    );
    return;
  }

  const [businessSnapshot, collaboratorSnapshot] = await Promise.all([
    firestore.collection("businesses").doc(businessId).get(),
    firestore
      .collection("businesses")
      .doc(businessId)
      .collection("collaborators")
      .doc(collaboratorId)
      .get(),
  ]);

  if (
    !collaboratorSnapshot.exists ||
    collaboratorSnapshot.data()?.status !== COLLABORATOR_STATUS.INVITED
  ) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.INVALID_INVITATION,
        "Invalid or expired invitation link",
      ),
    );
    return;
  }

  sendJsonResponse(response, HTTP_STATUS.OK, {
    businessName: String(businessSnapshot.data()?.name || ""),
    email: String(
      collaboratorSnapshot.data()?.email || invitationRecord.email || "",
    ),
  });
};

const handleAcceptCollaboratorInvitation = async (
  payload: Record<string, unknown>,
  response: ServerResponse,
  auth: Auth,
  firestore: Firestore,
): Promise<void> => {
  const parsed = acceptInvitationPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
      error: "invalid-argument",
      message: "Invalid invitation acceptance payload",
    });
    return;
  }

  const isRecaptchaValid = await verifyRecaptchaToken(
    parsed.data.recaptchaToken,
  );
  if (!isRecaptchaValid) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.BAD_REQUEST,
        "invalid-argument",
        COLLABORATOR_ERROR_REASON.RECAPTCHA_INVALID,
        "reCAPTCHA verification failed",
      ),
    );
    return;
  }

  const tokenHash = hashToken(parsed.data.invitationToken);
  const invitationReference = firestore
    .collection("collaboratorInvitations")
    .doc(tokenHash);
  const invitationSnapshot = await invitationReference.get();

  if (!invitationSnapshot.exists) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.INVALID_INVITATION,
        "Invalid or expired invitation link",
      ),
    );
    return;
  }

  const invitationRecord = invitationSnapshot.data() as Record<string, unknown>;
  const businessId = String(invitationRecord.businessId || "");
  const collaboratorId = String(invitationRecord.collaboratorId || "");
  const expiresAtMillis = toDateMillis(invitationRecord.expiresAt);

  if (
    invitationRecord.usedAt !== null ||
    typeof expiresAtMillis !== "number" ||
    expiresAtMillis <= Date.now() ||
    !businessId ||
    !collaboratorId
  ) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.INVALID_INVITATION,
        "Invalid or expired invitation link",
      ),
    );
    return;
  }

  const collaboratorReference = firestore
    .collection("businesses")
    .doc(businessId)
    .collection("collaborators")
    .doc(collaboratorId);
  const collaboratorSnapshot = await collaboratorReference.get();

  if (
    !collaboratorSnapshot.exists ||
    collaboratorSnapshot.data()?.status !== COLLABORATOR_STATUS.INVITED
  ) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.INVALID_INVITATION,
        "Invalid or expired invitation link",
      ),
    );
    return;
  }

  const collaboratorRecord = collaboratorSnapshot.data() as Record<
    string,
    unknown
  >;
  const email = String(
    collaboratorRecord.email || invitationRecord.email || "",
  );
  const fullName = String(collaboratorRecord.fullName || "");
  const phone = String(collaboratorRecord.phone || "");

  let createdUserId: string;
  try {
    const createdUser = await auth.createUser({
      displayName: fullName,
      email,
      emailVerified: true,
      password: parsed.data.password,
    });
    createdUserId = createdUser.uid;
  } catch (error) {
    if (hasErrorCode(error, COLLABORATOR_RULE.AUTH_EMAIL_ALREADY_EXISTS_CODE)) {
      sendCodedError(
        response,
        new CollaboratorActionError(
          HTTP_STATUS.CONFLICT,
          "already-exists",
          COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE,
          "An account already exists with this email",
        ),
      );
      return;
    }
    throw error;
  }

  const userReference = firestore.collection("users").doc(createdUserId);

  try {
    await auth.setCustomUserClaims(createdUserId, {
      businessId,
      collaboratorId,
      role: "collaborator",
    });

    await firestore.runTransaction(async (transaction) => {
      const [freshInvitationSnapshot, freshCollaboratorSnapshot] =
        await Promise.all([
          transaction.get(invitationReference),
          transaction.get(collaboratorReference),
        ]);

      const freshInvitation =
        freshInvitationSnapshot.data() as NullableUndefined<
          Record<string, unknown>
        >;
      const freshExpiresMillis = toDateMillis(freshInvitation?.expiresAt);
      if (
        !freshInvitationSnapshot.exists ||
        freshInvitation?.usedAt !== null ||
        typeof freshExpiresMillis !== "number" ||
        freshExpiresMillis <= Date.now() ||
        !freshCollaboratorSnapshot.exists ||
        freshCollaboratorSnapshot.data()?.status !== COLLABORATOR_STATUS.INVITED
      ) {
        throw new CollaboratorActionError(
          HTTP_STATUS.PRECONDITION_FAILED,
          "failed-precondition",
          COLLABORATOR_ERROR_REASON.INVALID_INVITATION,
          "Invalid or expired invitation link",
        );
      }

      const nowTimestamp = toTimestamp(new Date());
      transaction.update(invitationReference, {
        usedAt: nowTimestamp,
      });
      transaction.update(collaboratorReference, {
        status: COLLABORATOR_STATUS.ACTIVE,
        updatedAt: nowTimestamp,
        userId: createdUserId,
      });
      transaction.set(userReference, {
        businessId,
        collaboratorId,
        email,
        fullName,
        language: "es",
        phone,
        role: "collaborator",
        theme: "system",
        uid: createdUserId,
      });
    });
  } catch (error) {
    await auth.deleteUser(createdUserId).catch(() => undefined);
    throw error;
  }

  sendJsonResponse(response, HTTP_STATUS.OK, {
    email,
    status: COLLABORATOR_STATUS.ACTIVE,
  });
};

const handleUpdateCollaborator = async (
  payload: Record<string, unknown>,
  response: ServerResponse,
  auth: Auth,
  firestore: Firestore,
): Promise<void> => {
  const parsed = updateCollaboratorPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
      error: "invalid-argument",
      message: "Invalid collaborator update payload",
    });
    return;
  }

  const input = parsed.data;
  const uniqueServiceIds = Array.from(new Set(input.serviceIds));
  const businessReference = firestore
    .collection("businesses")
    .doc(input.businessId);
  const collaboratorReference = businessReference
    .collection("collaborators")
    .doc(input.collaboratorId);

  const currentSnapshot = await collaboratorReference.get();
  if (!currentSnapshot.exists || currentSnapshot.data()?.is_owner === true) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.NOT_FOUND,
        "not-found",
        COLLABORATOR_ERROR_REASON.NOT_FOUND,
        "Collaborator not found",
      ),
    );
    return;
  }

  const currentData = currentSnapshot.data() as Record<string, unknown>;
  const currentEmail = String(currentData.email || "")
    .trim()
    .toLowerCase();
  const isEmailChanged = Boolean(input.email && input.email !== currentEmail);

  if (isEmailChanged && currentData.status !== COLLABORATOR_STATUS.INVITED) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.INVALID_EMAIL_CHANGE_STATUS,
        "Email can only be updated while invitation is pending",
      ),
    );
    return;
  }

  if (isEmailChanged && input.email) {
    await verifyAuthEmailAvailable(auth, input.email);
  }

  const previousServiceIds = Array.isArray(currentData.serviceIds)
    ? (currentData.serviceIds as string[])
    : [];
  const removedServiceIds = previousServiceIds.filter(
    (serviceId) => !uniqueServiceIds.includes(serviceId),
  );

  let upcomingAffectedBookingsCount = 0;
  if (removedServiceIds.length > 0) {
    const bookingsSnapshot = await businessReference
      .collection("bookings")
      .where("collaboratorId", "==", input.collaboratorId)
      .where("status", "in", BOOKING_ACTIVE_STATUSES)
      .get();

    const nowMillis = Date.now();
    upcomingAffectedBookingsCount = bookingsSnapshot.docs.filter(
      (bookingDocument) => {
        const bookingData = bookingDocument.data() as Record<string, unknown>;
        const startsAtMillis = toDateMillis(bookingData.startsAt);
        const serviceId = String(bookingData.serviceId || "");
        return (
          typeof startsAtMillis === "number" &&
          startsAtMillis > nowMillis &&
          removedServiceIds.includes(serviceId)
        );
      },
    ).length;
  }

  const pendingInvitationsSnapshot = isEmailChanged
    ? await firestore
        .collection("collaboratorInvitations")
        .where("collaboratorId", "==", input.collaboratorId)
        .where("usedAt", "==", null)
        .get()
    : null;
  const nextInvitation =
    isEmailChanged && input.email ? createInvitationToken() : null;

  await firestore.runTransaction(async (transaction) => {
    const freshSnapshot = await transaction.get(collaboratorReference);
    if (!freshSnapshot.exists || freshSnapshot.data()?.is_owner === true) {
      throw new CollaboratorActionError(
        HTTP_STATUS.NOT_FOUND,
        "not-found",
        COLLABORATOR_ERROR_REASON.NOT_FOUND,
        "Collaborator not found",
      );
    }

    const freshRecord = freshSnapshot.data() as Record<string, unknown>;
    if (input.expectedUpdatedAt) {
      const currentUpdatedAtIso = toIsoString(freshRecord.updatedAt);
      if (
        currentUpdatedAtIso &&
        currentUpdatedAtIso !== input.expectedUpdatedAt
      ) {
        throw new CollaboratorActionError(
          HTTP_STATUS.CONFLICT,
          "aborted",
          COLLABORATOR_ERROR_REASON.CONCURRENT_MODIFICATION,
          "Collaborator was updated by another session",
        );
      }
    }

    if (isEmailChanged && input.email) {
      const existingCollaborators = await transaction.get(
        businessReference.collection("collaborators"),
      );
      const isDuplicate = existingCollaborators.docs.some((documentItem) => {
        if (documentItem.id === input.collaboratorId) {
          return false;
        }
        const record = documentItem.data() as Record<string, unknown>;
        if (record.is_owner === true) {
          return false;
        }
        return (
          String(record.email || "")
            .trim()
            .toLowerCase() === input.email
        );
      });
      if (isDuplicate) {
        throw new CollaboratorActionError(
          HTTP_STATUS.CONFLICT,
          "already-exists",
          COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE,
          "A collaborator with this email already exists in the business",
        );
      }
    }

    const serviceSnapshots = await Promise.all(
      uniqueServiceIds.map((serviceId) =>
        transaction.get(
          businessReference.collection("services").doc(serviceId),
        ),
      ),
    );
    const hasInvalidService = serviceSnapshots.some(
      (serviceSnapshot) =>
        !serviceSnapshot.exists ||
        serviceSnapshot.data()?.status !== ACTIVE_RECORD_STATUS,
    );
    if (hasInvalidService) {
      throw new CollaboratorActionError(
        HTTP_STATUS.BAD_REQUEST,
        "invalid-argument",
        COLLABORATOR_ERROR_REASON.INVALID_SERVICE_IDS,
        "Selected services must exist and be active",
      );
    }

    const nowDate = new Date();
    const nowTimestamp = toTimestamp(nowDate);
    const updateFields: Record<string, unknown> = {
      fullName: input.fullName,
      phone: input.phone,
      searchName: normalizeSearchTerm(input.fullName),
      serviceIds: uniqueServiceIds,
      specialty: input.specialty?.trim() || null,
      updatedAt: nowTimestamp,
    };

    if (isEmailChanged && input.email && nextInvitation) {
      updateFields.email = input.email;
      updateFields.lastEmailSentAt = nowTimestamp;

      if (pendingInvitationsSnapshot) {
        for (const pendingInvitation of pendingInvitationsSnapshot.docs) {
          transaction.update(pendingInvitation.ref, { usedAt: nowTimestamp });
        }
      }

      const newInvitationReference = firestore
        .collection("collaboratorInvitations")
        .doc(nextInvitation.tokenHash);
      transaction.create(newInvitationReference, {
        businessId: input.businessId,
        collaboratorId: input.collaboratorId,
        createdAt: nowTimestamp,
        email: input.email,
        expiresAt: toTimestamp(
          new Date(nowDate.getTime() + COLLABORATOR_RULE.INVITATION_TTL_MS),
        ),
        usedAt: null,
      });
    }

    transaction.update(collaboratorReference, updateFields);
  });

  sendJsonResponse(response, HTTP_STATUS.OK, {
    collaboratorId: input.collaboratorId,
    emailChanged: isEmailChanged,
    invitationToken: nextInvitation?.rawToken ?? null,
    upcomingAffectedBookingsCount,
  });
};

const handleUpdateCollaboratorStatus = async (
  payload: Record<string, unknown>,
  response: ServerResponse,
  auth: Auth,
  firestore: Firestore,
): Promise<void> => {
  const parsed = updateStatusPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
      error: "invalid-argument",
      message: "Invalid collaborator status payload",
    });
    return;
  }

  const input = parsed.data;
  const businessReference = firestore
    .collection("businesses")
    .doc(input.businessId);
  const businessSnapshot = await businessReference.get();
  if (
    !businessSnapshot.exists ||
    businessSnapshot.data()?.status !== ACTIVE_RECORD_STATUS
  ) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.BUSINESS_NOT_ACTIVE,
        "Business must be active",
      ),
    );
    return;
  }

  const limitInfo =
    input.targetStatus === COLLABORATOR_STATUS.ACTIVE
      ? await readPlanLimitInfo(
          firestore,
          input.businessId,
          businessSnapshot.data() as Record<string, unknown>,
        )
      : { hasHigherPlan: false, maxCollaborators: null };

  const collaboratorReference = businessReference
    .collection("collaborators")
    .doc(input.collaboratorId);

  let linkedUserId: Nullable<string> = null;

  await firestore.runTransaction(async (transaction) => {
    const collaboratorSnapshot = await transaction.get(collaboratorReference);
    if (
      !collaboratorSnapshot.exists ||
      collaboratorSnapshot.data()?.is_owner === true
    ) {
      throw new CollaboratorActionError(
        HTTP_STATUS.NOT_FOUND,
        "not-found",
        COLLABORATOR_ERROR_REASON.NOT_FOUND,
        "Collaborator not found",
      );
    }

    const record = collaboratorSnapshot.data() as Record<string, unknown>;
    const currentStatus = String(record.status || "");
    const allowedTargets = COLLABORATOR_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowedTargets.includes(input.targetStatus)) {
      throw new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.INVALID_STATUS_TRANSITION,
        `Cannot transition collaborator from ${currentStatus} to ${input.targetStatus}`,
      );
    }

    if (
      input.targetStatus === COLLABORATOR_STATUS.ACTIVE &&
      typeof limitInfo.maxCollaborators === "number"
    ) {
      const existingCollaborators = await transaction.get(
        businessReference.collection("collaborators"),
      );
      const activeAndInvitedCount = existingCollaborators.docs.filter(
        (documentItem) => {
          const documentRecord = documentItem.data() as Record<string, unknown>;
          if (documentRecord.is_owner === true) {
            return false;
          }
          return (
            documentRecord.status === COLLABORATOR_STATUS.ACTIVE ||
            documentRecord.status === COLLABORATOR_STATUS.INVITED
          );
        },
      ).length;

      if (activeAndInvitedCount >= limitInfo.maxCollaborators) {
        throw new CollaboratorActionError(
          HTTP_STATUS.PRECONDITION_FAILED,
          "failed-precondition",
          COLLABORATOR_ERROR_REASON.LIMIT_REACHED,
          "Collaborator plan limit reached",
          {
            hasHigherPlan: limitInfo.hasHigherPlan,
            limit: limitInfo.maxCollaborators,
          },
        );
      }
    }

    linkedUserId =
      typeof record.userId === "string" && record.userId.length > 0
        ? record.userId
        : null;

    transaction.update(collaboratorReference, {
      status: input.targetStatus,
      updatedAt: toTimestamp(new Date()),
    });
  });

  if (linkedUserId) {
    const isDisabling = input.targetStatus === COLLABORATOR_STATUS.INACTIVE;
    await auth.updateUser(linkedUserId, { disabled: isDisabling });
    if (isDisabling) {
      await auth.revokeRefreshTokens(linkedUserId);
    } else {
      await auth.setCustomUserClaims(linkedUserId, {
        businessId: input.businessId,
        collaboratorId: input.collaboratorId,
        role: "collaborator",
      });
    }
  }

  sendJsonResponse(response, HTTP_STATUS.OK, {
    collaboratorId: input.collaboratorId,
    status: input.targetStatus,
  });
};

const handleUpdateCollaboratorPermissions = async (
  payload: Record<string, unknown>,
  response: ServerResponse,
  firestore: Firestore,
): Promise<void> => {
  const parsed = updatePermissionsPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
      error: "invalid-argument",
      message: "Invalid permissions payload",
    });
    return;
  }

  const input = parsed.data;
  const allowedSet = new Set<string>(COLLABORATOR_PERMISSION_VALUES);
  const hasInvalidPermission = input.permissions.some(
    (permission) => !allowedSet.has(permission),
  );
  if (hasInvalidPermission) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.BAD_REQUEST,
        "invalid-argument",
        COLLABORATOR_ERROR_REASON.INVALID_PERMISSIONS,
        "Unknown collaborator permission",
      ),
    );
    return;
  }

  const collaboratorReference = firestore
    .collection("businesses")
    .doc(input.businessId)
    .collection("collaborators")
    .doc(input.collaboratorId);

  const collaboratorSnapshot = await collaboratorReference.get();
  if (
    !collaboratorSnapshot.exists ||
    collaboratorSnapshot.data()?.is_owner === true
  ) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.NOT_FOUND,
        "not-found",
        COLLABORATOR_ERROR_REASON.NOT_FOUND,
        "Collaborator not found",
      ),
    );
    return;
  }

  const uniquePermissions = Array.from(new Set(input.permissions));
  await collaboratorReference.update({
    permissions: uniquePermissions,
    updatedAt: toTimestamp(new Date()),
  });

  sendJsonResponse(response, HTTP_STATUS.OK, {
    collaboratorId: input.collaboratorId,
    permissions: uniquePermissions,
  });
};

const handleResendCollaboratorEmail = async (
  payload: Record<string, unknown>,
  response: ServerResponse,
  firestore: Firestore,
): Promise<void> => {
  const parsed = resendEmailPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
      error: "invalid-argument",
      message: "Invalid resend payload",
    });
    return;
  }

  const input = parsed.data;
  const businessReference = firestore
    .collection("businesses")
    .doc(input.businessId);
  const collaboratorReference = businessReference
    .collection("collaborators")
    .doc(input.collaboratorId);

  const collaboratorSnapshot = await collaboratorReference.get();
  if (
    !collaboratorSnapshot.exists ||
    collaboratorSnapshot.data()?.is_owner === true
  ) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.NOT_FOUND,
        "not-found",
        COLLABORATOR_ERROR_REASON.NOT_FOUND,
        "Collaborator not found",
      ),
    );
    return;
  }

  const record = collaboratorSnapshot.data() as Record<string, unknown>;
  const currentStatus = String(record.status || "");

  if (
    currentStatus !== COLLABORATOR_STATUS.INVITED &&
    currentStatus !== COLLABORATOR_STATUS.ACTIVE
  ) {
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.PRECONDITION_FAILED,
        "failed-precondition",
        COLLABORATOR_ERROR_REASON.INVALID_STATUS_FOR_RESEND,
        "Emails can only be sent to invited or active collaborators",
      ),
    );
    return;
  }

  const lastSentMillis = toDateMillis(record.lastEmailSentAt);
  const nowMillis = Date.now();
  if (
    typeof lastSentMillis === "number" &&
    nowMillis - lastSentMillis < COLLABORATOR_RULE.RESEND_COOLDOWN_MS
  ) {
    const retryAfterSeconds = Math.ceil(
      (COLLABORATOR_RULE.RESEND_COOLDOWN_MS - (nowMillis - lastSentMillis)) /
        COLLABORATOR_RULE.MS_PER_SECOND,
    );
    sendCodedError(
      response,
      new CollaboratorActionError(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        "resource-exhausted",
        COLLABORATOR_ERROR_REASON.COOLDOWN_ACTIVE,
        "Wait before resending another email",
        { retryAfterSeconds },
      ),
    );
    return;
  }

  const nowTimestamp = toTimestamp(new Date(nowMillis));
  const email = String(record.email || "");

  if (currentStatus === COLLABORATOR_STATUS.INVITED) {
    const pendingInvitationsSnapshot = await firestore
      .collection("collaboratorInvitations")
      .where("collaboratorId", "==", input.collaboratorId)
      .where("usedAt", "==", null)
      .get();

    const { rawToken, tokenHash } = createInvitationToken();
    const newInvitationReference = firestore
      .collection("collaboratorInvitations")
      .doc(tokenHash);

    await firestore.runTransaction(async (transaction) => {
      for (const pendingInvitation of pendingInvitationsSnapshot.docs) {
        transaction.update(pendingInvitation.ref, { usedAt: nowTimestamp });
      }
      transaction.create(newInvitationReference, {
        businessId: input.businessId,
        collaboratorId: input.collaboratorId,
        createdAt: nowTimestamp,
        email,
        expiresAt: toTimestamp(
          new Date(nowMillis + COLLABORATOR_RULE.INVITATION_TTL_MS),
        ),
        usedAt: null,
      });
      transaction.update(collaboratorReference, {
        lastEmailSentAt: nowTimestamp,
        updatedAt: nowTimestamp,
      });
    });

    sendJsonResponse(response, HTTP_STATUS.OK, {
      collaboratorId: input.collaboratorId,
      invitationToken: rawToken,
      kind: "invitation",
    });
    return;
  }

  const userId = typeof record.userId === "string" ? record.userId : "";
  const userSnapshot = userId
    ? await firestore.collection("users").doc(userId).get()
    : null;
  const preferredLanguage = String(userSnapshot?.data()?.language || "es");

  await sendPasswordResetViaIdentityToolkit(email, preferredLanguage);
  await collaboratorReference.update({
    lastEmailSentAt: nowTimestamp,
    updatedAt: nowTimestamp,
  });

  sendJsonResponse(response, HTTP_STATUS.OK, {
    collaboratorId: input.collaboratorId,
    invitationToken: null,
    kind: "password_reset",
  });
};

export const handleCollaboratorFunction = async (
  functionName: string,
  payload: Record<string, unknown>,
  response: ServerResponse,
  auth: Auth,
  firestore: Firestore,
): Promise<boolean> => {
  try {
    switch (functionName) {
      case COLLABORATOR_FUNCTION_NAME.REGISTER_COLLABORATOR:
        await handleRegisterCollaborator(payload, response, auth, firestore);
        return true;
      case COLLABORATOR_FUNCTION_NAME.VALIDATE_COLLABORATOR_INVITATION:
        await handleValidateCollaboratorInvitation(
          payload,
          response,
          firestore,
        );
        return true;
      case COLLABORATOR_FUNCTION_NAME.ACCEPT_COLLABORATOR_INVITATION:
        await handleAcceptCollaboratorInvitation(
          payload,
          response,
          auth,
          firestore,
        );
        return true;
      case COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR:
        await handleUpdateCollaborator(payload, response, auth, firestore);
        return true;
      case COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR_STATUS:
        await handleUpdateCollaboratorStatus(
          payload,
          response,
          auth,
          firestore,
        );
        return true;
      case COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR_PERMISSIONS:
        await handleUpdateCollaboratorPermissions(payload, response, firestore);
        return true;
      case COLLABORATOR_FUNCTION_NAME.RESEND_COLLABORATOR_EMAIL:
        await handleResendCollaboratorEmail(payload, response, firestore);
        return true;
      default:
        return false;
    }
  } catch (error) {
    if (error instanceof CollaboratorActionError) {
      sendCodedError(response, error);
      return true;
    }
    throw error;
  }
};
