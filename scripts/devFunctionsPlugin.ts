import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import type { Plugin, ViteDevServer } from "vite";
import { HTTP_METHOD } from "../src/constants/common/HttpMethod.constants";
import { FUNCTION_NAME } from "../src/constants/firebase/FunctionName.constants";
import { TIME_MS } from "../src/constants/numbers/Time.constants";
import { SERVICE_STATUS } from "../src/domain/service/ServiceStatus.constants";

interface CallFunctionRequestBody {
  readonly functionName?: string;
  readonly payload?: Record<string, unknown>;
}

const findServiceAccountPath = (): string => {
  const rootDirectory = process.cwd();
  const fileNames = fs.readdirSync(rootDirectory);
  const keyFileName = fileNames.find(
    (fileName) =>
      fileName.includes("firebase-adminsdk") && fileName.endsWith(".json"),
  );

  if (!keyFileName) {
    throw new Error("No service account key (*firebase-adminsdk*.json) found.");
  }

  return path.join(rootDirectory, keyFileName);
};

const getAdminServices = (): {
  auth: ReturnType<typeof getAuth>;
  firestore: ReturnType<typeof getFirestore>;
} => {
  const existingApps = getApps();
  const firstApp = existingApps[0];
  const adminApp =
    firstApp ??
    initializeApp({
      credential: cert(
        JSON.parse(fs.readFileSync(findServiceAccountPath(), "utf-8")),
      ),
    });

  return {
    auth: getAuth(adminApp),
    firestore: getFirestore(adminApp),
  };
};

const readJsonBody = async (
  request: IncomingMessage,
): Promise<CallFunctionRequestBody> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const rawBody = Buffer.concat(chunks).toString("utf-8");
        resolve(
          rawBody ? (JSON.parse(rawBody) as CallFunctionRequestBody) : {},
        );
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", (error) => {
      reject(error);
    });
  });

export const devFunctionsPlugin = (): Plugin => ({
  configureServer(server: ViteDevServer): void {
    server.middlewares.use(
      "/__api/callFunction",
      (
        request: IncomingMessage,
        response: ServerResponse,
        next: () => void,
      ): void => {
        if (request.method !== HTTP_METHOD.POST) {
          next();
          return;
        }

        void (async (): Promise<void> => {
          try {
            const body = await readJsonBody(request);
            const { functionName, payload = {} } = body;
            const { auth, firestore } = getAdminServices();

            if (functionName === FUNCTION_NAME.VERIFY_RECAPTCHA) {
              response.statusCode = 200;
              response.setHeader("Content-Type", "application/json");
              response.end(JSON.stringify({ isVerified: true }));
              return;
            }

            if (functionName === FUNCTION_NAME.REQUEST_PASSWORD_RESET) {
              response.statusCode = 200;
              response.setHeader("Content-Type", "application/json");
              response.end(JSON.stringify({ isRequested: true }));
              return;
            }

            if (functionName === FUNCTION_NAME.VALIDATE_SIGN_UP_LINK) {
              const rawToken = String(payload.signUpToken || "");
              const signUpToken = decodeURIComponent(rawToken);
              const email = signUpToken.includes("@")
                ? signUpToken
                : "nuevo-negocio@demo.com";
              response.statusCode = 200;
              response.setHeader("Content-Type", "application/json");
              response.end(
                JSON.stringify({
                  amountInCents: 2900,
                  billingPeriod: "monthly",
                  checkoutEmail: email,
                  email,
                  planName: "Plan Profesional",
                }),
              );
              return;
            }

            if (functionName === FUNCTION_NAME.CHECK_BUSINESS_SLUG) {
              const slug = String(payload.slug || "").toLowerCase();
              const slugDoc = await firestore
                .collection("businessSlugs")
                .doc(slug)
                .get();

              response.statusCode = 200;
              response.setHeader("Content-Type", "application/json");
              response.end(JSON.stringify({ isAvailable: !slugDoc.exists }));
              return;
            }

            if (functionName === FUNCTION_NAME.DELETE_SERVICE) {
              const businessId = String(payload.businessId || "");
              const serviceId = String(payload.serviceId || "");

              if (!businessId || !serviceId) {
                response.statusCode = 400;
                response.setHeader("Content-Type", "application/json");
                response.end(JSON.stringify({ error: "missing-parameters" }));
                return;
              }

              const serviceReference = firestore
                .collection("businesses")
                .doc(businessId)
                .collection("services")
                .doc(serviceId);

              const serviceSnapshot = await serviceReference.get();
              if (!serviceSnapshot.exists) {
                response.statusCode = 404;
                response.setHeader("Content-Type", "application/json");
                response.end(JSON.stringify({ error: "not-found" }));
                return;
              }

              const serviceData = serviceSnapshot.data() || {};
              if (serviceData.status !== SERVICE_STATUS.INACTIVE) {
                response.statusCode = 412;
                response.setHeader("Content-Type", "application/json");
                response.end(
                  JSON.stringify({
                    details: { reason: "must_be_inactive" },
                    error: "failed-precondition",
                    message: "must_be_inactive",
                  }),
                );
                return;
              }

              await serviceReference.delete();

              response.statusCode = 200;
              response.setHeader("Content-Type", "application/json");
              response.end(JSON.stringify({ deletedServiceId: serviceId }));
              return;
            }

            if (functionName === FUNCTION_NAME.COMPLETE_SUBSCRIBER_SIGN_UP) {
              const email = String(
                payload.email ||
                  payload.signUpToken ||
                  "nuevo-negocio@demo.com",
              );
              const password = String(payload.password || "Password123!");
              const fullName = String(payload.fullName || "Nuevo Negocio");
              const businessName = String(
                payload.businessName || "Mi Nuevo Negocio",
              );
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
                  status: "active",
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

              await businessReference
                .collection("subscription")
                .doc("current")
                .set({
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
                status: "active",
              });

              await firestore
                .collection("businessSlugs")
                .doc(businessSlug)
                .set({
                  businessId,
                  createdAt: Timestamp.now(),
                });

              response.statusCode = 200;
              response.setHeader("Content-Type", "application/json");
              response.end(JSON.stringify({ email }));
              return;
            }

            response.statusCode = 404;
            response.setHeader("Content-Type", "application/json");
            response.end(
              JSON.stringify({
                error: `Function ${functionName} not implemented in dev handler`,
              }),
            );
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json");
            response.end(
              JSON.stringify({
                error:
                  error instanceof Error
                    ? error.message
                    : "Internal server error",
              }),
            );
          }
        })();
      },
    );
  },
  name: "dev-functions-bridge",
});
