import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getFirestore,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import type { Nullable } from "../src/types/Nullable";

const HTTP_METHOD = Object.freeze({
  DELETE: "DELETE",
  GET: "GET",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
  PATCH: "PATCH",
  POST: "POST",
  PUT: "PUT",
} as const);

const HTTP_STATUS = Object.freeze({
  BAD_REQUEST: 400,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  METHOD_NOT_ALLOWED: 405,
  NOT_FOUND: 404,
  OK: 200,
  PRECONDITION_FAILED: 412,
} as const);

const FUNCTION_NAME = Object.freeze({
  CANCEL_BOOKING: "cancelBooking",
  CHECK_BUSINESS_SLUG: "checkBusinessSlug",
  COMPLETE_SUBSCRIBER_SIGN_UP: "completeSubscriberSignUp",
  CREATE_BOOKING: "createBooking",
  CREATE_SERVICE: "createService",
  DELETE_SERVICE: "deleteService",
  EXPORT_COLLECTION: "exportCollection",
  PAY_PLAN_CHECKOUT: "payPlanCheckout",
  REQUEST_PASSWORD_RESET: "requestPasswordReset",
  RESCHEDULE_BOOKING: "rescheduleBooking",
  SEND_CONTACT_MESSAGE: "sendContactMessage",
  UPDATE_BOOKING_STATUS: "updateBookingStatus",
  UPDATE_SERVICE: "updateService",
  UPDATE_SERVICE_COLLABORATORS: "updateServiceCollaborators",
  VALIDATE_SIGN_UP_LINK: "validateSignUpLink",
  VERIFY_RECAPTCHA: "verifyRecaptcha",
} as const);

const MONEY = Object.freeze({
  CENTS_PER_UNIT: 100,
} as const);

const TIME_MS = Object.freeze({
  THIRTY_DAYS: 2_592_000_000,
} as const);

const BOOKING_CONFIRMATION_MODE = Object.freeze({
  AUTOMATIC: "automatic",
  MANUAL: "manual",
} as const);

const BOOKING_STATUS = Object.freeze({
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  CONFIRMED: "confirmed",
  NO_SHOW: "no_show",
  PENDING: "pending",
} as const);

const BUSINESS_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
} as const);

const CUSTOMER_STATUS = Object.freeze({
  ACTIVE: "active",
  BLOCKED: "blocked",
} as const);

const SERVICE_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const);

const CHECKOUT_SIMULATION = Object.freeze({
  DECLINED_CARD_NUMBER: "4000000000000002",
  DECLINED_CARD_SUFFIX: "0002",
  PROCESSING_DELAY_MS: 600,
} as const);

// Error codes the Admin SDK reports: Auth as text, Firestore as a gRPC status.
const FIREBASE_ADMIN_ERROR_CODE = Object.freeze({
  EMAIL_ALREADY_EXISTS: "auth/email-already-exists",
  FIRESTORE_ALREADY_EXISTS: 6,
} as const);

// Mirror of SIGN_UP_ERROR_REASON in
// functions/src/billing/constants/SubscriberSignUp.constants.ts — keep in sync.
const SIGN_UP_ERROR_REASON = Object.freeze({
  ACCOUNT_EXISTS: "accountExists",
  SLUG_TAKEN: "slugTaken",
} as const);

const DIACRITIC_PATTERN = /\p{Diacritic}/gu;

const normalizeSearchTerm = (searchTerm: string): string =>
  searchTerm
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, "")
    .trim()
    .toLowerCase();

const hasErrorCode = (error: unknown, errorCode: number | string): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === errorCode;

interface CallFunctionRequestBody {
  readonly functionName?: string;
  readonly payload?: Record<string, unknown>;
}

const findLocalServiceAccountPath = (): Nullable<string> => {
  const rootDirectory = process.cwd();
  if (!fs.existsSync(rootDirectory)) {
    return null;
  }
  const fileNames = fs.readdirSync(rootDirectory);
  const keyFileName = fileNames.find(
    (fileName) =>
      fileName.includes("firebase-adminsdk") && fileName.endsWith(".json"),
  );

  return keyFileName ? path.join(rootDirectory, keyFileName) : null;
};

const getServiceAccountCredentials = (): Nullable<Record<string, unknown>> => {
  const serviceAccountRaw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ||
    process.env.FIREBASE_CREDENTIALS ||
    process.env.SERVICE_ACCOUNT ||
    process.env.SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (serviceAccountRaw) {
    let rawString = serviceAccountRaw.trim();
    if (
      (rawString.startsWith('"') && rawString.endsWith('"')) ||
      (rawString.startsWith("'") && rawString.endsWith("'"))
    ) {
      rawString = rawString.slice(1, -1).trim();
    }

    let parsedObject: Nullable<Record<string, unknown>> = null;
    try {
      let parsed = JSON.parse(rawString) as unknown;
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed) as unknown;
      }
      if (typeof parsed === "object" && parsed !== null) {
        parsedObject = parsed as Record<string, unknown>;
      }
    } catch {
      try {
        const decodedString = Buffer.from(rawString, "base64").toString(
          "utf-8",
        );
        let parsed = JSON.parse(decodedString) as unknown;
        if (typeof parsed === "string") {
          parsed = JSON.parse(parsed) as unknown;
        }
        if (typeof parsed === "object" && parsed !== null) {
          parsedObject = parsed as Record<string, unknown>;
        }
      } catch {
        parsedObject = null;
      }
    }

    if (parsedObject) {
      if (
        typeof parsedObject.private_key === "string" &&
        parsedObject.private_key.includes("\\n")
      ) {
        parsedObject.private_key = parsedObject.private_key.replace(
          /\\n/g,
          "\n",
        );
      }
      if (
        typeof parsedObject.privateKey === "string" &&
        parsedObject.privateKey.includes("\\n")
      ) {
        parsedObject.privateKey = parsedObject.privateKey.replace(/\\n/g, "\n");
      }
      return parsedObject;
    }
  }

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.GCP_PROJECT ||
    process.env.GCLOUD_PROJECT;

  if (clientEmail && privateKey && projectId) {
    privateKey = privateKey.trim();
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");

    return {
      clientEmail,
      client_email: clientEmail,
      privateKey,
      private_key: privateKey,
      projectId,
      project_id: projectId,
    };
  }

  const localKeyPath = findLocalServiceAccountPath();
  if (localKeyPath) {
    try {
      return JSON.parse(fs.readFileSync(localKeyPath, "utf-8")) as Record<
        string,
        unknown
      >;
    } catch {
      return null;
    }
  }

  return null;
};

const getAdminServices = (): {
  auth: Auth;
  firestore: Firestore;
} => {
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    const existingApp = existingApps[0];
    return {
      auth: getAuth(existingApp),
      firestore: getFirestore(existingApp),
    };
  }

  const serviceAccount = getServiceAccountCredentials();
  if (!serviceAccount) {
    throw new Error(
      "Firebase credentials not found. Configure FIREBASE_SERVICE_ACCOUNT in your environment variables.",
    );
  }

  const adminApp = initializeApp({
    credential: cert(serviceAccount),
  });

  return {
    auth: getAuth(adminApp),
    firestore: getFirestore(adminApp),
  };
};

const readJsonBody = async (
  request: IncomingMessage & { body?: unknown },
): Promise<CallFunctionRequestBody> => {
  if (request.body && typeof request.body === "object") {
    return request.body as CallFunctionRequestBody;
  }
  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body) as CallFunctionRequestBody;
    } catch {
      return {};
    }
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const rawContent = Buffer.concat(chunks).toString("utf-8");
        resolve(
          rawContent ? (JSON.parse(rawContent) as CallFunctionRequestBody) : {},
        );
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", (error) => {
      reject(error);
    });
  });
};

const sendJsonResponse = (
  response: ServerResponse,
  statusCode: number,
  responseContent: unknown,
): void => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(responseContent));
};

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  if (request.method === HTTP_METHOD.OPTIONS) {
    response.statusCode = HTTP_STATUS.OK;
    response.end();
    return;
  }

  if (request.method !== HTTP_METHOD.POST) {
    sendJsonResponse(response, HTTP_STATUS.METHOD_NOT_ALLOWED, {
      error: "Method not allowed",
    });
    return;
  }

  try {
    const requestBody = await readJsonBody(request);
    const { functionName, payload = {} } = requestBody;
    const { auth, firestore } = getAdminServices();

    if (functionName === FUNCTION_NAME.VERIFY_RECAPTCHA) {
      sendJsonResponse(response, HTTP_STATUS.OK, { isVerified: true });
      return;
    }

    if (functionName === FUNCTION_NAME.SEND_CONTACT_MESSAGE) {
      await firestore.collection("contactMessages").add({
        createdAt: Timestamp.now(),
        email: String(payload.email || ""),
        message: String(payload.message || ""),
        name: String(payload.name || ""),
        status: "unread",
        subject: String(payload.subject || ""),
      });
      sendJsonResponse(response, HTTP_STATUS.OK, { isSent: true });
      return;
    }

    if (functionName === FUNCTION_NAME.REQUEST_PASSWORD_RESET) {
      sendJsonResponse(response, HTTP_STATUS.OK, { isRequested: true });
      return;
    }

    if (functionName === FUNCTION_NAME.VALIDATE_SIGN_UP_LINK) {
      const rawToken = String(payload.signUpToken || "");
      const signUpToken = decodeURIComponent(rawToken);
      const email = signUpToken.includes("@")
        ? signUpToken
        : "nuevo-negocio@demo.com";
      sendJsonResponse(response, HTTP_STATUS.OK, {
        amountInCents: 2900,
        billingPeriod: "monthly",
        checkoutEmail: email,
        email,
        planName: "Plan Profesional",
      });
      return;
    }

    if (functionName === FUNCTION_NAME.CHECK_BUSINESS_SLUG) {
      const slug = String(payload.slug || "").toLowerCase();
      const slugDocument = await firestore
        .collection("businessSlugs")
        .doc(slug)
        .get();

      sendJsonResponse(response, HTTP_STATUS.OK, {
        isAvailable: !slugDocument.exists,
      });
      return;
    }

    if (functionName === FUNCTION_NAME.DELETE_SERVICE) {
      const businessId = String(payload.businessId || "");
      const serviceId = String(payload.serviceId || "");

      if (!businessId || !serviceId) {
        sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
          error: "missing-parameters",
        });
        return;
      }

      const businessReference = firestore
        .collection("businesses")
        .doc(businessId);
      const businessSnapshot = await businessReference.get();
      if (
        !businessSnapshot.exists ||
        businessSnapshot.data()?.status !== BUSINESS_STATUS.ACTIVE
      ) {
        sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
          details: { reason: "business_not_active" },
          error: "failed-precondition",
          message: "business_not_active",
        });
        return;
      }

      const serviceReference = businessReference
        .collection("services")
        .doc(serviceId);

      const serviceSnapshot = await serviceReference.get();
      if (!serviceSnapshot.exists) {
        sendJsonResponse(response, HTTP_STATUS.NOT_FOUND, {
          error: "not-found",
        });
        return;
      }

      const serviceData = serviceSnapshot.data() || {};
      if (serviceData.status !== SERVICE_STATUS.INACTIVE) {
        sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
          details: { reason: "must_be_inactive" },
          error: "failed-precondition",
          message: "must_be_inactive",
        });
        return;
      }

      const activeBookingsSnapshot = await businessReference
        .collection("bookings")
        .where("serviceId", "==", serviceId)
        .where("status", "in", [
          BOOKING_STATUS.PENDING,
          BOOKING_STATUS.CONFIRMED,
        ])
        .limit(1)
        .get();

      if (!activeBookingsSnapshot.empty) {
        sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
          details: { reason: "has_active_bookings" },
          error: "failed-precondition",
          message: "has_active_bookings",
        });
        return;
      }

      await serviceReference.delete();
      sendJsonResponse(response, HTTP_STATUS.OK, {
        deletedServiceId: serviceId,
      });
      return;
    }

    if (functionName === FUNCTION_NAME.CREATE_SERVICE) {
      const businessId = String(payload.businessId || "");
      const formValues = (payload.formValues || {}) as {
        description?: string;
        durationMinutes?: number;
        features?: string[];
        imageUrl?: Nullable<string>;
        name?: string;
        price?: number;
      };

      if (!businessId || !formValues.name) {
        sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
          error: "missing-parameters",
        });
        return;
      }

      const sanitizedFeatures = (formValues.features ?? [])
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0);

      const priceInCents = Math.round(
        Number(formValues.price || 0) * MONEY.CENTS_PER_UNIT,
      );

      const servicesCollectionReference = firestore
        .collection("businesses")
        .doc(businessId)
        .collection("services");

      const documentReference = await servicesCollectionReference.add({
        createdAt: Timestamp.now(),
        description: (formValues.description || "").trim(),
        durationMinutes: Number(formValues.durationMinutes ?? 0),
        features: sanitizedFeatures,
        imageUrl: formValues.imageUrl ?? null,
        name: formValues.name.trim(),
        priceInCents,
        searchName: normalizeSearchTerm(formValues.name),
        status: SERVICE_STATUS.ACTIVE,
        updatedAt: Timestamp.now(),
      });

      sendJsonResponse(response, HTTP_STATUS.OK, {
        serviceId: documentReference.id,
      });
      return;
    }

    if (functionName === FUNCTION_NAME.UPDATE_SERVICE) {
      const businessId = String(payload.businessId || "");
      const serviceId = String(payload.serviceId || "");
      const formValues = (payload.formValues || {}) as {
        description?: string;
        durationMinutes?: number;
        features?: string[];
        imageUrl?: Nullable<string>;
        name?: string;
        price?: number;
      };

      if (!businessId || !serviceId || !formValues.name) {
        sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
          error: "missing-parameters",
        });
        return;
      }

      const sanitizedFeatures = (formValues.features ?? [])
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0);

      const priceInCents = Math.round(
        Number(formValues.price || 0) * MONEY.CENTS_PER_UNIT,
      );

      const serviceDocumentReference = firestore
        .collection("businesses")
        .doc(businessId)
        .collection("services")
        .doc(serviceId);

      await serviceDocumentReference.update({
        description: (formValues.description || "").trim(),
        durationMinutes: Number(formValues.durationMinutes ?? 0),
        features: sanitizedFeatures,
        imageUrl: formValues.imageUrl ?? null,
        name: formValues.name.trim(),
        priceInCents,
        searchName: normalizeSearchTerm(formValues.name),
        updatedAt: Timestamp.now(),
      });

      sendJsonResponse(response, HTTP_STATUS.OK, {
        serviceId,
      });
      return;
    }

    if (functionName === FUNCTION_NAME.COMPLETE_SUBSCRIBER_SIGN_UP) {
      const email = String(
        payload.email || payload.signUpToken || "nuevo-negocio@demo.com",
      );
      const password = String(payload.password || "Password123!");
      const fullName = String(payload.fullName || "Nuevo Negocio");
      const businessName = String(payload.businessName || "Mi Nuevo Negocio");
      const businessSlug = String(
        payload.businessSlug || "mi-nuevo-negocio",
      ).toLowerCase();
      const phone = payload.phone ? String(payload.phone) : null;
      const businessId = `business-${businessSlug}`;

      // A sign-up only creates: an email that already has an account is
      // rejected and that account is left as it is (AC-KAN-25-09, AS-5).
      let userId: string;
      try {
        const newUser = await auth.createUser({
          displayName: fullName,
          email,
          emailVerified: true,
          password,
        });
        userId = newUser.uid;
      } catch (error) {
        if (
          hasErrorCode(error, FIREBASE_ADMIN_ERROR_CODE.EMAIL_ALREADY_EXISTS)
        ) {
          sendJsonResponse(response, HTTP_STATUS.CONFLICT, {
            details: { reason: SIGN_UP_ERROR_REASON.ACCOUNT_EXISTS },
            error: "already-exists",
            message: "An account already exists for the checkout email",
          });
          return;
        }
        throw error;
      }

      const slugReference = firestore
        .collection("businessSlugs")
        .doc(businessSlug);
      const userReference = firestore.collection("users").doc(userId);
      const businessReference = firestore
        .collection("businesses")
        .doc(businessId);
      let isSlugReserved = false;
      let isBusinessCreated = false;

      try {
        // create() fails when the document exists, so two sign-ups never get
        // the same slug and an existing business is never rewritten
        // (AC-KAN-25-18).
        await slugReference.create({
          businessId,
          createdAt: Timestamp.now(),
        });
        isSlugReserved = true;

        await auth.setCustomUserClaims(userId, {
          businessId,
          business_id: businessId,
          role: "business_owner",
        });

        await userReference.set(
          {
            business_id: businessId,
            businessId,
            email,
            fullName,
            language: "en",
            phone,
            role: "business_owner",
            theme: "system",
            uid: userId,
          },
          { merge: true },
        );

        const currentPeriodEndsAt = Timestamp.fromMillis(
          Date.now() + TIME_MS.THIRTY_DAYS,
        );

        await businessReference.create({
          businessHours: {
            friday: [{ closesAt: "19:00", opensAt: "09:00" }],
            monday: [{ closesAt: "19:00", opensAt: "09:00" }],
            saturday: [{ closesAt: "19:00", opensAt: "09:00" }],
            sunday: [],
            thursday: [{ closesAt: "19:00", opensAt: "09:00" }],
            tuesday: [{ closesAt: "19:00", opensAt: "09:00" }],
            wednesday: [{ closesAt: "19:00", opensAt: "09:00" }],
          },
          contactEmail: email,
          contactPhone: phone,
          currency: "CRC",
          description: `Welcome to ${businessName}.`,
          id: businessId,
          logoUrl: null,
          name: businessName,
          owner_id: userId,
          ownerUserId: userId,
          plan_id: "plan-pro",
          reviewed_by: null,
          slug: businessSlug,
          socialLinks: [],
          status: BUSINESS_STATUS.ACTIVE,
          subscription: {
            cancelAtPeriodEnd: false,
            currentPeriodEndsAt,
            planId: "plan-pro",
            status: "active",
          },
          timeZone: "America/Costa_Rica",
        });
        isBusinessCreated = true;

        await businessReference.collection("subscription").doc("current").set({
          cancelAtPeriodEnd: false,
          currentPeriodEndsAt,
          planId: "plan-pro",
          status: "active",
        });

        await businessReference
          .collection("collaborators")
          .doc(userId)
          .set({
            email,
            fullName,
            is_owner: true,
            permissions: {
              manage_bookings: true,
              manage_customers: true,
              manage_schedule_blocks: true,
              manage_services: true,
              view_reports: true,
            },
            phone,
            service_ids: ["service-default"],
            status: "active",
            uid: userId,
          });

        const serviceReference = businessReference
          .collection("services")
          .doc("service-default");
        await serviceReference.set({
          description: "Standard service",
          discounts: [],
          durationMinutes: 30,
          name: "Standard Service",
          priceInCents: 20000,
          status: SERVICE_STATUS.ACTIVE,
        });
      } catch (error) {
        // Undo only what this call created, so the visitor can try again
        // with the same email (cloud-functions-standards §6).
        await Promise.allSettled([
          ...(isBusinessCreated
            ? [firestore.recursiveDelete(businessReference)]
            : []),
          ...(isSlugReserved ? [slugReference.delete()] : []),
          userReference.delete(),
          auth.deleteUser(userId),
        ]);

        if (
          hasErrorCode(
            error,
            FIREBASE_ADMIN_ERROR_CODE.FIRESTORE_ALREADY_EXISTS,
          )
        ) {
          sendJsonResponse(response, HTTP_STATUS.CONFLICT, {
            details: { reason: SIGN_UP_ERROR_REASON.SLUG_TAKEN },
            error: "already-exists",
            message: "The business slug is already taken",
          });
          return;
        }
        throw error;
      }

      sendJsonResponse(response, HTTP_STATUS.OK, { email });
      return;
    }

    if (functionName === FUNCTION_NAME.PAY_PLAN_CHECKOUT) {
      const cardNumber = String(payload.cardNumber || "");
      if (cardNumber === CHECKOUT_SIMULATION.DECLINED_CARD_NUMBER) {
        sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
          details: { reason: "paymentDeclined" },
          error: "failed-precondition",
          message: "The simulated gateway declined the card",
        });
        return;
      }

      const attemptId = String(payload.attemptId || `attempt-${Date.now()}`);
      const email = String(payload.email || "checkout@demo.com");
      const planId = String(payload.planId || "plan-pro");
      const checkoutReference = firestore
        .collection("planCheckouts")
        .doc(attemptId);

      await checkoutReference.set({
        amountInCents: Number(payload.expectedPriceInCents || 2900),
        email,
        language: String(payload.language || "es"),
        paidAt: Timestamp.now(),
        paymentReference: `sim_${Date.now().toString(16)}`,
        planId,
        signUpCompletedAt: null,
        signUpLinkExpiresAt: null,
        signUpTokenHash: null,
        termsAcceptedAt: Timestamp.now(),
        termsVersion: "provisional-2026-10-17",
      });

      sendJsonResponse(response, HTTP_STATUS.OK, { email });
      return;
    }

    if (functionName === FUNCTION_NAME.CREATE_BOOKING) {
      const businessId = String(payload.businessId || "");
      const serviceId = String(payload.serviceId || "");
      const customerId = String(payload.customerId || "");
      const collaboratorId = payload.collaboratorId
        ? String(payload.collaboratorId)
        : null;
      const startsAt = String(payload.startsAt || new Date().toISOString());
      const endsAt = payload.endsAt ? String(payload.endsAt) : null;

      const businessReference = firestore
        .collection("businesses")
        .doc(businessId);
      const businessSnapshot = await businessReference.get();
      if (
        !businessSnapshot.exists ||
        businessSnapshot.data()?.status !== BUSINESS_STATUS.ACTIVE
      ) {
        sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
          details: { reason: "service_unavailable" },
          error: "failed-precondition",
          message: "business_unavailable",
        });
        return;
      }

      const serviceReference = businessReference
        .collection("services")
        .doc(serviceId);
      const serviceSnapshot = await serviceReference.get();
      if (
        !serviceSnapshot.exists ||
        serviceSnapshot.data()?.status !== SERVICE_STATUS.ACTIVE
      ) {
        sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
          details: { reason: "service_unavailable" },
          error: "failed-precondition",
          message: "service_unavailable",
        });
        return;
      }

      if (customerId) {
        const customerSnapshot = await businessReference
          .collection("customers")
          .doc(customerId)
          .get();
        if (
          customerSnapshot.exists &&
          customerSnapshot.data()?.status === CUSTOMER_STATUS.BLOCKED
        ) {
          sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
            details: { reason: "customer_blocked" },
            error: "failed-precondition",
            message: "customer_blocked",
          });
          return;
        }
      }

      let collaboratorName: Nullable<string> = null;
      if (collaboratorId) {
        const collaboratorSnapshot = await businessReference
          .collection("collaborators")
          .doc(collaboratorId)
          .get();
        if (collaboratorSnapshot.exists) {
          collaboratorName =
            (collaboratorSnapshot.data()?.fullName as string) || null;
        }
      }

      const serviceData = serviceSnapshot.data() || {};
      const serviceSnapshotData = {
        discounts: serviceData.discounts || [],
        durationMinutes: Number(serviceData.durationMinutes || 30),
        name: String(serviceData.name || "Servicio"),
        priceInCents: Number(serviceData.priceInCents || 0),
      };

      const startsAtDate = new Date(startsAt);
      const durationMilliseconds =
        serviceSnapshotData.durationMinutes * 60 * 1000;
      const endsAtDate = endsAt
        ? new Date(endsAt)
        : new Date(startsAtDate.getTime() + durationMilliseconds);

      const existingBookingsSnapshot = await businessReference
        .collection("bookings")
        .where("status", "in", [
          BOOKING_STATUS.PENDING,
          BOOKING_STATUS.CONFIRMED,
        ])
        .get();

      const hasBookingCollision = existingBookingsSnapshot.docs.some((doc) => {
        const bookingItem = doc.data();
        if (
          collaboratorId &&
          bookingItem.collaboratorId &&
          bookingItem.collaboratorId !== collaboratorId
        ) {
          return false;
        }
        const existingStart = bookingItem.startsAt?.toDate
          ? bookingItem.startsAt.toDate()
          : new Date(bookingItem.startsAt);
        const existingEnd = bookingItem.endsAt?.toDate
          ? bookingItem.endsAt.toDate()
          : new Date(bookingItem.endsAt);
        return startsAtDate < existingEnd && endsAtDate > existingStart;
      });

      if (hasBookingCollision) {
        sendJsonResponse(response, HTTP_STATUS.CONFLICT, {
          details: { reason: "slot_taken" },
          error: "conflict",
          message: "slot_taken",
        });
        return;
      }

      const blocksSnapshot = await businessReference
        .collection("scheduleBlocks")
        .get();

      const hasBlockCollision = blocksSnapshot.docs.some((doc) => {
        const blockItem = doc.data();
        if (
          collaboratorId &&
          blockItem.collaboratorId &&
          blockItem.collaboratorId !== collaboratorId
        ) {
          return false;
        }
        const blockStart = blockItem.startsAt?.toDate
          ? blockItem.startsAt.toDate()
          : new Date(blockItem.startsAt);
        const blockEnd = blockItem.endsAt?.toDate
          ? blockItem.endsAt.toDate()
          : new Date(blockItem.endsAt);
        return startsAtDate < blockEnd && endsAtDate > blockStart;
      });

      if (hasBlockCollision) {
        sendJsonResponse(response, HTTP_STATUS.CONFLICT, {
          details: { reason: "slot_taken" },
          error: "conflict",
          message: "slot_taken",
        });
        return;
      }

      const businessData = businessSnapshot.data() || {};
      const confirmationMode =
        businessData.bookingConfirmationMode ||
        BOOKING_CONFIRMATION_MODE.AUTOMATIC;
      const initialStatus =
        confirmationMode === BOOKING_CONFIRMATION_MODE.MANUAL
          ? BOOKING_STATUS.PENDING
          : BOOKING_STATUS.CONFIRMED;

      const bookingReference = businessReference.collection("bookings").doc();
      await bookingReference.set({
        businessId,
        cancellation: null,
        collaboratorId,
        collaboratorName,
        createdAt: Timestamp.now(),
        customerId,
        customerUserId: customerId,
        endsAt: endsAtDate,
        id: bookingReference.id,
        rescheduleHistory: [],
        serviceId,
        serviceSnapshot: serviceSnapshotData,
        startsAt: startsAtDate,
        status: initialStatus,
        updatedAt: Timestamp.now(),
      });

      sendJsonResponse(response, HTTP_STATUS.OK, {
        bookingId: bookingReference.id,
        serviceSnapshot: serviceSnapshotData,
        status: initialStatus,
      });
      return;
    }

    if (functionName === FUNCTION_NAME.CANCEL_BOOKING) {
      const businessId = String(payload.businessId || "");
      const bookingId = String(payload.bookingId || "");
      const note = String(payload.note || "").trim();
      const isPenalized = Boolean(payload.isPenalized);
      const cancelledBy = String(payload.cancelledBy || "business");

      if (!businessId || !bookingId) {
        sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
          error: "missing-parameters",
        });
        return;
      }

      if (!note) {
        sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
          details: { field: "note", reason: "required" },
          error: "validation-error",
          message: "note is required",
        });
        return;
      }

      if (note.length > 500) {
        sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
          details: { field: "note", reason: "too_long" },
          error: "validation-error",
          message: "note cannot exceed 500 characters",
        });
        return;
      }

      const bookingReference = firestore
        .collection("businesses")
        .doc(businessId)
        .collection("bookings")
        .doc(bookingId);

      const bookingSnapshot = await bookingReference.get();
      if (!bookingSnapshot.exists) {
        sendJsonResponse(response, HTTP_STATUS.NOT_FOUND, {
          error: "not-found",
        });
        return;
      }

      const bookingData = bookingSnapshot.data() || {};
      if (
        bookingData.status !== BOOKING_STATUS.PENDING &&
        bookingData.status !== BOOKING_STATUS.CONFIRMED
      ) {
        sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
          details: {
            currentStatus: bookingData.status,
            reason: "invalid_transition",
          },
          error: "failed-precondition",
          message: "invalid_transition",
        });
        return;
      }

      await bookingReference.update({
        cancellation: {
          cancelledAt: Timestamp.now(),
          cancelledBy,
          isPenalized,
          note,
        },
        status: BOOKING_STATUS.CANCELLED,
        updatedAt: Timestamp.now(),
      });

      sendJsonResponse(response, HTTP_STATUS.OK, {
        bookingId,
        status: BOOKING_STATUS.CANCELLED,
      });
      return;
    }

    if (functionName === FUNCTION_NAME.RESCHEDULE_BOOKING) {
      const businessId = String(payload.businessId || "");
      const bookingId = String(payload.bookingId || "");
      const newStartsAt = String(payload.newStartsAt || "");

      if (!businessId || !bookingId || !newStartsAt) {
        sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
          error: "missing-parameters",
        });
        return;
      }

      const bookingReference = firestore
        .collection("businesses")
        .doc(businessId)
        .collection("bookings")
        .doc(bookingId);

      const bookingSnapshot = await bookingReference.get();
      if (!bookingSnapshot.exists) {
        sendJsonResponse(response, HTTP_STATUS.NOT_FOUND, {
          error: "not-found",
        });
        return;
      }

      const bookingData = bookingSnapshot.data() || {};
      if (
        bookingData.status !== BOOKING_STATUS.PENDING &&
        bookingData.status !== BOOKING_STATUS.CONFIRMED
      ) {
        sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
          details: { reason: "cannot_reschedule" },
          error: "failed-precondition",
          message: "cannot_reschedule",
        });
        return;
      }

      const currentStartsAtDate = bookingData.startsAt?.toDate
        ? bookingData.startsAt.toDate()
        : new Date(bookingData.startsAt);

      if (currentStartsAtDate.getTime() <= Date.now()) {
        sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
          details: { reason: "cannot_reschedule_past" },
          error: "failed-precondition",
          message: "cannot_reschedule_past",
        });
        return;
      }

      const durationMinutes = Number(
        bookingData.serviceSnapshot?.durationMinutes || 30,
      );
      const newStartsAtDate = new Date(newStartsAt);
      if (newStartsAtDate.getTime() <= Date.now()) {
        sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
          details: { reason: "slot_in_past" },
          error: "invalid-argument",
          message: "slot_in_past",
        });
        return;
      }
      const newEndsAtDate = new Date(
        newStartsAtDate.getTime() + durationMinutes * 60 * 1000,
      );

      const businessReference = firestore
        .collection("businesses")
        .doc(businessId);
      const existingBookingsSnapshot = await businessReference
        .collection("bookings")
        .where("status", "in", [
          BOOKING_STATUS.PENDING,
          BOOKING_STATUS.CONFIRMED,
        ])
        .get();

      const hasCollision = existingBookingsSnapshot.docs.some((doc) => {
        if (doc.id === bookingId) {
          return false;
        }
        const candidateBooking = doc.data();
        if (
          bookingData.collaboratorId &&
          candidateBooking.collaboratorId &&
          candidateBooking.collaboratorId !== bookingData.collaboratorId
        ) {
          return false;
        }
        const start = candidateBooking.startsAt?.toDate
          ? candidateBooking.startsAt.toDate()
          : new Date(candidateBooking.startsAt);
        const end = candidateBooking.endsAt?.toDate
          ? candidateBooking.endsAt.toDate()
          : new Date(candidateBooking.endsAt);
        return newStartsAtDate < end && newEndsAtDate > start;
      });

      if (hasCollision) {
        sendJsonResponse(response, HTTP_STATUS.CONFLICT, {
          details: { reason: "slot_taken" },
          error: "conflict",
          message: "slot_taken",
        });
        return;
      }

      const rescheduleHistory = Array.isArray(bookingData.rescheduleHistory)
        ? [...bookingData.rescheduleHistory]
        : [];

      rescheduleHistory.push({
        changedAt: Timestamp.now(),
        previousEndsAt: bookingData.endsAt,
        previousStartsAt: bookingData.startsAt,
      });

      await bookingReference.update({
        endsAt: newEndsAtDate,
        rescheduleHistory,
        startsAt: newStartsAtDate,
        updatedAt: Timestamp.now(),
      });

      sendJsonResponse(response, HTTP_STATUS.OK, {
        bookingId,
        endsAt: newEndsAtDate.toISOString(),
        startsAt: newStartsAtDate.toISOString(),
      });
      return;
    }

    if (functionName === FUNCTION_NAME.UPDATE_BOOKING_STATUS) {
      const businessId = String(payload.businessId || "");
      const bookingId = String(payload.bookingId || "");
      const targetStatus = String(payload.targetStatus || "");

      if (!businessId || !bookingId || !targetStatus) {
        sendJsonResponse(response, HTTP_STATUS.BAD_REQUEST, {
          error: "missing-parameters",
        });
        return;
      }

      const bookingReference = firestore
        .collection("businesses")
        .doc(businessId)
        .collection("bookings")
        .doc(bookingId);

      const bookingSnapshot = await bookingReference.get();
      if (!bookingSnapshot.exists) {
        sendJsonResponse(response, HTTP_STATUS.NOT_FOUND, {
          error: "not-found",
        });
        return;
      }

      const bookingData = bookingSnapshot.data() || {};
      const currentStatus = bookingData.status;
      const startsAtDate = bookingData.startsAt?.toDate
        ? bookingData.startsAt.toDate()
        : new Date(bookingData.startsAt);

      if (targetStatus === BOOKING_STATUS.CONFIRMED) {
        if (currentStatus !== BOOKING_STATUS.PENDING) {
          sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
            details: { currentStatus, reason: "invalid_transition" },
            error: "failed-precondition",
            message: "invalid_transition",
          });
          return;
        }
      } else if (
        targetStatus === BOOKING_STATUS.COMPLETED ||
        targetStatus === BOOKING_STATUS.NO_SHOW
      ) {
        if (currentStatus !== BOOKING_STATUS.CONFIRMED) {
          sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
            details: { currentStatus, reason: "invalid_transition" },
            error: "failed-precondition",
            message: "invalid_transition",
          });
          return;
        }
        if (startsAtDate.getTime() > Date.now()) {
          sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
            details: { reason: "not_started" },
            error: "failed-precondition",
            message: "not_started",
          });
          return;
        }
      } else {
        sendJsonResponse(response, HTTP_STATUS.PRECONDITION_FAILED, {
          details: { reason: "unsupported_status" },
          error: "failed-precondition",
          message: "unsupported_status",
        });
        return;
      }

      await bookingReference.update({
        status: targetStatus,
        updatedAt: Timestamp.now(),
      });

      sendJsonResponse(response, HTTP_STATUS.OK, {
        bookingId,
        status: targetStatus,
      });
      return;
    }

    if (functionName === FUNCTION_NAME.UPDATE_SERVICE_COLLABORATORS) {
      const businessId = String(payload.businessId || "");
      const serviceId = String(payload.serviceId || "");
      const collaboratorIds = Array.isArray(payload.collaboratorIds)
        ? (payload.collaboratorIds as string[])
        : [];
      const collaboratorSelection = payload.collaboratorSelection
        ? String(payload.collaboratorSelection)
        : null;

      const businessReference = firestore
        .collection("businesses")
        .doc(businessId);
      const serviceReference = businessReference
        .collection("services")
        .doc(serviceId);

      await serviceReference.update({
        collaboratorSelection:
          collaboratorIds.length === 0
            ? null
            : (collaboratorSelection ?? "customer_choice"),
      });

      const collaboratorsSnapshot = await businessReference
        .collection("collaborators")
        .get();
      const batch = firestore.batch();

      collaboratorsSnapshot.forEach((collaboratorDoc) => {
        const collaboratorData = collaboratorDoc.data();
        const currentServiceIds: string[] = Array.isArray(
          collaboratorData.serviceIds,
        )
          ? (collaboratorData.serviceIds as string[])
          : [];
        const shouldBeAssigned = collaboratorIds.includes(collaboratorDoc.id);
        const isCurrentlyAssigned = currentServiceIds.includes(serviceId);

        if (shouldBeAssigned && !isCurrentlyAssigned) {
          batch.update(collaboratorDoc.ref, {
            serviceIds: [...currentServiceIds, serviceId],
          });
        } else if (!shouldBeAssigned && isCurrentlyAssigned) {
          batch.update(collaboratorDoc.ref, {
            serviceIds: currentServiceIds.filter((id) => id !== serviceId),
          });
        }
      });

      await batch.commit();
      sendJsonResponse(response, HTTP_STATUS.OK, {
        updatedServiceId: serviceId,
      });
      return;
    }

    sendJsonResponse(response, HTTP_STATUS.NOT_FOUND, {
      error: `Function ${functionName} not implemented in server handler`,
    });
  } catch (error) {
    sendJsonResponse(response, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      error: error instanceof Error ? error.message : "Internal server error",
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
