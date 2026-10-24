/**
 * Script para aprovisionar un negocio y su cuenta de suscriptor directamente
 * en el proyecto real de Firebase utilizando las credenciales del Service Account.
 *
 * Uso:
 *   npx tsx scripts/provision-business-account.ts [email] [password] [nombreNegocio] [slug]
 *
 * Ejemplo:
 *   npx tsx scripts/provision-business-account.ts mi-negocio@demo.com MiPassword123! "Barberia Elite" barberia-elite
 */
import fs from "node:fs";
import path from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { FIRESTORE_COLLECTION } from "../src/constants/firestore/FirestoreCollection.constants";
import { LANGUAGE } from "../src/constants/i18n/Language.constants";
import { THEME_MODE } from "../src/constants/theme/ThemeMode.constants";
import { BUSINESS_STATUS } from "../src/domain/business/BusinessStatus.constants";
import { isReservedBusinessSlug } from "../src/domain/business/isReservedBusinessSlug";
import { PLAN_STATUS } from "../src/domain/plan/PlanStatus.constants";
import { SERVICE_STATUS } from "../src/domain/service/ServiceStatus.constants";
import { SUBSCRIPTION_STATUS } from "../src/domain/subscription/SubscriptionStatus.constants";
import { USER_ROLE } from "../src/domain/user/UserRole.constants";
import { normalizeSearchTerm } from "../src/utils/normalizeSearchTerm";

const findServiceAccountKeyPath = (): string => {
  const rootDir = process.cwd();
  const files = fs.readdirSync(rootDir);
  const keyFileName = files.find(
    (fileName) =>
      fileName.includes("firebase-adminsdk") && fileName.endsWith(".json"),
  );

  if (!keyFileName) {
    throw new Error(
      "No se encontro ningun archivo de Service Account (*firebase-adminsdk*.json) en la raiz del proyecto.",
    );
  }

  return path.join(rootDir, keyFileName);
};

const keyPath = findServiceAccountKeyPath();
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

const adminApp = initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth(adminApp);
const firestore = getFirestore(adminApp);

const DEFAULT_CREDENTIALS = {
  BUSINESS_NAME: "Barberia Real",
  EMAIL: "negocio@booking.com",
  PASSWORD: "Password123!",
  PHONE: "+52 55 1234 5678",
  SLUG: "barberia-real",
};

const email = process.argv[2] || DEFAULT_CREDENTIALS.EMAIL;
const password = process.argv[3] || DEFAULT_CREDENTIALS.PASSWORD;
const businessName = process.argv[4] || DEFAULT_CREDENTIALS.BUSINESS_NAME;
const slug = (process.argv[5] || DEFAULT_CREDENTIALS.SLUG).toLowerCase();

if (isReservedBusinessSlug(slug)) {
  console.error(`Error: El slug '${slug}' esta reservado por el sistema.`);
  process.exit(1);
}

const provision = async (): Promise<void> => {
  console.log("==================================================");
  console.log("Aprovisionando cuenta de negocio en Firebase real:");
  console.log(`Proyecto:      ${serviceAccount.project_id}`);
  console.log(`Email:         ${email}`);
  console.log(`Password:      ${password}`);
  console.log(`Negocio:       ${businessName}`);
  console.log(`Slug:          ${slug}`);
  console.log("==================================================\n");

  // 1. Obtener o crear el usuario en Firebase Auth
  let userId: string;
  try {
    const existingUser = await auth.getUserByEmail(email);
    userId = existingUser.uid;
    console.log(
      `- Usuario existente encontrado (UID: ${userId}). Actualizando contrasena...`,
    );
    await auth.updateUser(userId, {
      emailVerified: true,
      password,
    });
  } catch {
    console.log("- Creando nuevo usuario en Firebase Auth...");
    const newUser = await auth.createUser({
      displayName: businessName,
      email,
      emailVerified: true,
      password,
    });
    userId = newUser.uid;
    console.log(`- Usuario creado con UID: ${userId}`);
  }

  const businessId = `business-${slug}`;

  // 2. Asignar los Custom Claims de Firebase Auth requeridos por la app
  console.log(
    "- Asignando Custom Claims (role: business_owner, business_id)...",
  );
  await auth.setCustomUserClaims(userId, {
    businessId,
    business_id: businessId,
    role: USER_ROLE.BUSINESS_OWNER,
  });

  // 3. Crear o actualizar el perfil de usuario en /users/{userId} segun el diagrama ER
  console.log("- Guardando perfil en coleccion 'users' (USER)...");
  await firestore
    .collection(FIRESTORE_COLLECTION.USERS)
    .doc(userId)
    .set(
      {
        business_id: businessId,
        businessId,
        email,
        fullName: businessName,
        language: process.argv[6] || LANGUAGE.EN,
        phone: DEFAULT_CREDENTIALS.PHONE,
        role: USER_ROLE.BUSINESS_OWNER,
        theme: THEME_MODE.SYSTEM,
        uid: userId,
      },
      { merge: true },
    );

  // 4. Crear planes si no existen para que las suscripciones funcionen
  const plansCollection = firestore.collection(FIRESTORE_COLLECTION.PLANS);
  const planDoc = await plansCollection.doc("plan-pro").get();
  if (!planDoc.exists) {
    console.log("- Creando los 3 planes de suscripcion en Firestore...");
    await plansCollection.doc("plan-basic").set({
      billingPeriod: "monthly",
      features: [
        "Hasta 50 reservas al mes",
        "1 profesional o colaborador",
        "Recordatorios básicos por correo",
        "Soporte por correo electrónico",
      ],
      limits: { maxBookings: 50 },
      name: "Plan Básico",
      priceInCents: 1500,
      status: PLAN_STATUS.ACTIVE,
    });
    await plansCollection.doc("plan-pro").set({
      billingPeriod: "monthly",
      features: [
        "Hasta 250 reservas al mes",
        "Hasta 5 colaboradores",
        "Recordatorios por WhatsApp y correo",
        "Gestión de horarios y descansos",
        "Soporte prioritario",
      ],
      limits: { maxBookings: 250 },
      name: "Plan Profesional",
      priceInCents: 2900,
      status: PLAN_STATUS.ACTIVE,
    });
    await plansCollection.doc("plan-enterprise").set({
      billingPeriod: "monthly",
      features: [
        "Reservas mensuales ilimitadas",
        "Colaboradores ilimitados",
        "Reportes analíticos avanzados",
        "Integración de pagos en línea",
        "Soporte dedicado 24/7",
      ],
      limits: { maxBookings: 1000 },
      name: "Plan Empresarial",
      priceInCents: 4900,
      status: PLAN_STATUS.ACTIVE,
    });
  }

  // 5. Crear el documento del negocio en /businesses/{businessId} segun el diagrama ER (BUSINESS)
  console.log(
    "- Guardando datos del negocio en coleccion 'businesses' (BUSINESS)...",
  );
  const businessRef = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
  const currentPeriodEndsAt = Timestamp.fromMillis(Date.now() + oneMonthMs);

  await businessRef.set(
    {
      businessHours: {
        monday: [{ closesAt: "19:00", opensAt: "09:00" }],
        tuesday: [{ closesAt: "19:00", opensAt: "09:00" }],
        wednesday: [{ closesAt: "19:00", opensAt: "09:00" }],
        thursday: [{ closesAt: "19:00", opensAt: "09:00" }],
        friday: [{ closesAt: "19:00", opensAt: "09:00" }],
        saturday: [{ closesAt: "19:00", opensAt: "09:00" }],
        sunday: [],
      },
      contactEmail: email,
      contactPhone: DEFAULT_CREDENTIALS.PHONE,
      currency: "CRC",
      description: `Bienvenido a ${businessName}. Citas y reservas disponibles.`,
      id: businessId,
      logoUrl: null,
      name: businessName,
      owner_id: userId,
      ownerUserId: userId,
      plan_id: "plan-pro",
      reviewed_by: null,
      slug,
      socialLinks: [],
      status: BUSINESS_STATUS.ACTIVE,
      subscription: {
        cancelAtPeriodEnd: false,
        currentPeriodEndsAt,
        planId: "plan-pro",
        status: SUBSCRIPTION_STATUS.ACTIVE,
      },
      timeZone: "America/Costa_Rica",
    },
    { merge: true },
  );

  // 6. Asignar suscripcion activa en /businesses/{businessId}/subscription/current
  console.log(
    "- Configurando suscripcion activa en subcoleccion 'subscription'...",
  );
  await businessRef
    .collection(FIRESTORE_COLLECTION.SUBSCRIPTION)
    .doc("current")
    .set({
      cancelAtPeriodEnd: false,
      currentPeriodEndsAt,
      planId: "plan-pro",
      status: SUBSCRIPTION_STATUS.ACTIVE,
    });

  // 7. Diagrama ER: "employs, owner included", is_owner: true
  console.log(
    "- Registrando dueno en coleccion 'collaborators' (is_owner: true)...",
  );
  await businessRef
    .collection(FIRESTORE_COLLECTION.COLLABORATORS)
    .doc(userId)
    .set({
      email,
      fullName: businessName,
      is_owner: true,
      permissions: {
        manage_bookings: true,
        manage_customers: true,
        manage_schedule_blocks: true,
        manage_services: true,
        view_reports: true,
      },
      phone: DEFAULT_CREDENTIALS.PHONE,
      service_ids: ["servicio-corte-clasico", "servicio-barba-completo"],
      status: "active",
      uid: userId,
    });

  // 7. Crear servicios iniciales
  console.log("- Agregando servicios de prueba en subcoleccion 'services'...");
  const servicesRef = businessRef.collection(FIRESTORE_COLLECTION.SERVICES);
  await servicesRef.doc("servicio-corte-clasico").set({
    description: "Corte de cabello clasico o moderno con lavado incluido.",
    discounts: [],
    durationMinutes: 30,
    name: "Corte de Cabello",
    priceInCents: 15000,
    searchName: normalizeSearchTerm("Corte de Cabello"),
    status: SERVICE_STATUS.ACTIVE,
  });

  await servicesRef.doc("servicio-barba-completo").set({
    description: "Perfilado y arreglo de barba con toalla caliente.",
    discounts: [],
    durationMinutes: 20,
    name: "Perfilado de Barba",
    priceInCents: 10000,
    searchName: normalizeSearchTerm("Perfilado de Barba"),
    status: SERVICE_STATUS.ACTIVE,
  });

  // 8. Reservar el slug en /businessSlugs/{slug}
  console.log("- Registrando slug en coleccion 'businessSlugs'...");
  await firestore.collection("businessSlugs").doc(slug).set({
    businessId,
    createdAt: Timestamp.now(),
  });

  console.log("\n==================================================");
  console.log("¡LISTO! Cuenta aprovisionada exitosamente.");
  console.log(`Correo para login: ${email}`);
  console.log(`Contrasena:        ${password}`);
  console.log(`Portal del negocio: http://localhost:5173/business`);
  console.log(`Portal del cliente: http://localhost:5173/${slug}`);
  console.log("==================================================");
};

provision().catch((error) => {
  console.error("Error aprovisionando la cuenta:", error);
  process.exit(1);
});
