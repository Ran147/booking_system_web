import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getFirestore,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import { HTTP_METHOD } from "../src/constants/common/HttpMethod.constants";
import { HTTP_STATUS } from "../src/constants/common/HttpStatus.constants";
import { FUNCTION_NAME } from "../src/constants/firebase/FunctionName.constants";
import { MONEY } from "../src/constants/numbers/Money.constants";
import { TIME_MS } from "../src/constants/numbers/Time.constants";
import { BOOKING_STATUS } from "../src/domain/booking/BookingStatus.constants";
import { BUSINESS_STATUS } from "../src/domain/business/BusinessStatus.constants";
import { SERVICE_STATUS } from "../src/domain/service/ServiceStatus.constants";
import { CHECKOUT_SIMULATION } from "../src/modules/landing/features/plan-checkout/constants/PlanCheckout.constants";
import type { Nullable } from "../src/types/Nullable";
import { normalizeSearchTerm } from "../src/utils/normalizeSearchTerm";

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

  let adminApp: App;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let serviceAccountJson: Record<string, unknown>;
    try {
      serviceAccountJson = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT,
      ) as Record<string, unknown>;
    } catch {
      try {
        const decodedString = Buffer.from(
          process.env.FIREBASE_SERVICE_ACCOUNT,
          "base64",
        ).toString("utf-8");
        serviceAccountJson = JSON.parse(decodedString) as Record<
          string,
          unknown
        >;
      } catch {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT is neither valid JSON nor valid base64 JSON string.",
        );
      }
    }

    adminApp = initializeApp({
      credential: cert(serviceAccountJson),
    });
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    adminApp = initializeApp({
      credential: cert({
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        projectId: process.env.FIREBASE_PROJECT_ID,
      }),
    });
  } else {
    const localKeyPath = findLocalServiceAccountPath();
    if (localKeyPath) {
      const serviceAccountJson = JSON.parse(
        fs.readFileSync(localKeyPath, "utf-8"),
      ) as Record<string, unknown>;
      adminApp = initializeApp({
        credential: cert(serviceAccountJson),
      });
    } else {
      throw new Error(
        "Firebase credentials not found. Configure FIREBASE_SERVICE_ACCOUNT in your environment variables.",
      );
    }
  }

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

      let userId: string;
      try {
        const existingUser = await auth.getUserByEmail(email);
        userId = existingUser.uid;
        await auth.updateUser(userId, {
          displayName: fullName,
          emailVerified: true,
          password,
        });
      } catch {
        const newUser = await auth.createUser({
          displayName: fullName,
          email,
          emailVerified: true,
          password,
        });
        userId = newUser.uid;
      }

      await auth.setCustomUserClaims(userId, {
        businessId,
        business_id: businessId,
        role: "business_owner",
      });

      await firestore.collection("users").doc(userId).set(
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

      const businessReference = firestore
        .collection("businesses")
        .doc(businessId);
      await businessReference.set(
        {
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
        },
        { merge: true },
      );

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

      await firestore.collection("businessSlugs").doc(businessSlug).set({
        businessId,
        createdAt: Timestamp.now(),
      });

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

      const bookingReference = businessReference.collection("bookings").doc();
      await bookingReference.set({
        businessId,
        cancellation: null,
        collaboratorId,
        collaboratorName,
        customerId,
        customerUserId: customerId,
        endsAt: endsAtDate,
        id: bookingReference.id,
        rescheduleHistory: [],
        serviceId,
        serviceSnapshot: serviceSnapshotData,
        startsAt: startsAtDate,
        status: "confirmed",
      });

      sendJsonResponse(response, HTTP_STATUS.OK, {
        bookingId: bookingReference.id,
        serviceSnapshot: serviceSnapshotData,
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
    });
  }
}
