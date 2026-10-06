// Seeds the local Firebase Emulator Suite with test accounts, one active
// business with a collaborator, and one business pending approval, so the
// team can sign in locally. Not a story; see README "Datos de prueba".
//
//   npx firebase emulators:exec --only auth,firestore --project demo-booking-system "npm run seed"
//
// It refuses to run unless both emulator hosts are set, so it can never touch
// a real Firebase project. Every write uses fixed ids: running it twice leaves
// the same data.
import { initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getFirestore,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import {
  SEED_AUTH_ERROR_CODE,
  SEED_BILLING_PERIOD,
  SEED_BUSINESS,
  SEED_BUSINESS_HOURS_RANGE,
  SEED_DEFAULT_PROJECT_ID,
  SEED_DOCUMENT_ID,
  SEED_ENV_VAR,
  SEED_PAYMENT_RESULT,
  SEED_PENDING_BUSINESS,
  SEED_PLAN,
  SEED_SERVICE,
  SEED_SUBSCRIPTION_PERIOD,
  SEED_TABLE_CELL,
  SEED_USER,
  SEED_WEEKDAY,
} from "./constants/SeedEmulator.constants";
import { FIRESTORE_COLLECTION } from "../src/shared/constants/firestore/FirestoreCollection.constants";
import { THEME_MODE } from "../src/shared/constants/theme/ThemeMode.constants";
import { BUSINESS_STATUS } from "../src/shared/domain/business/BusinessStatus.constants";
import { isReservedBusinessSlug } from "../src/shared/domain/business/isReservedBusinessSlug";
import { COLLABORATOR_PERMISSION } from "../src/shared/domain/collaborator/CollaboratorPermission.constants";
import { COLLABORATOR_STATUS } from "../src/shared/domain/collaborator/CollaboratorStatus.constants";
import { PLAN_STATUS } from "../src/shared/domain/plan/PlanStatus.constants";
import { SERVICE_STATUS } from "../src/shared/domain/service/ServiceStatus.constants";
import { SUBSCRIPTION_STATUS } from "../src/shared/domain/subscription/SubscriptionStatus.constants";
import {
  USER_ROLE,
  type UserRole,
} from "../src/shared/domain/user/UserRole.constants";

interface SeedUser {
  EMAIL: string;
  FULL_NAME: string;
  PASSWORD: string;
  PHONE: string;
  UID: string;
}

interface SeedUserClaims {
  businessId?: string;
  collaboratorId?: string;
  role: UserRole;
}

interface SeedService {
  DESCRIPTION: string;
  DURATION_MINUTES: number;
  NAME: string;
  PRICE_IN_CENTS: number;
}

interface SeedPlan {
  MAX_BOOKINGS: number;
  NAME: string;
  PRICE_IN_CENTS: number;
}

const readMissingEmulatorHosts = (): string[] =>
  [
    SEED_ENV_VAR.FIRESTORE_EMULATOR_HOST,
    SEED_ENV_VAR.AUTH_EMULATOR_HOST,
  ].filter((envVarName) => !process.env[envVarName]);

const hasErrorCode = (error: unknown, errorCode: string): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === errorCode;

const upsertAuthUser = async (
  auth: Auth,
  seedUser: SeedUser,
  claims: SeedUserClaims,
): Promise<void> => {
  const userProperties = {
    displayName: seedUser.FULL_NAME,
    email: seedUser.EMAIL,
    emailVerified: true,
    password: seedUser.PASSWORD,
  };

  try {
    await auth.getUser(seedUser.UID);
    await auth.updateUser(seedUser.UID, userProperties);
  } catch (error) {
    if (!hasErrorCode(error, SEED_AUTH_ERROR_CODE.USER_NOT_FOUND)) throw error;
    await auth.createUser({ ...userProperties, uid: seedUser.UID });
  }

  // Custom claims as in auth-and-roles §1.
  await auth.setCustomUserClaims(seedUser.UID, claims);
};

const writeUserProfile = async (
  firestore: Firestore,
  seedUser: SeedUser,
): Promise<void> => {
  await firestore.collection(FIRESTORE_COLLECTION.USERS).doc(seedUser.UID).set({
    email: seedUser.EMAIL,
    fullName: seedUser.FULL_NAME,
    phone: seedUser.PHONE,
    theme: THEME_MODE.SYSTEM,
  });
};

const buildPlanDocument = (seedPlan: SeedPlan): Record<string, unknown> => ({
  billingPeriod: SEED_BILLING_PERIOD.MONTHLY,
  limits: { maxBookings: seedPlan.MAX_BOOKINGS },
  name: seedPlan.NAME,
  priceInCents: seedPlan.PRICE_IN_CENTS,
  status: PLAN_STATUS.ACTIVE,
});

const buildServiceDocument = (
  seedService: SeedService,
): Record<string, unknown> => ({
  description: seedService.DESCRIPTION,
  discounts: [],
  durationMinutes: seedService.DURATION_MINUTES,
  name: seedService.NAME,
  priceInCents: seedService.PRICE_IN_CENTS,
  status: SERVICE_STATUS.ACTIVE,
});

const buildBusinessHours = (): Record<string, unknown> => {
  const openRange = [
    {
      closesAt: SEED_BUSINESS_HOURS_RANGE.CLOSES_AT,
      opensAt: SEED_BUSINESS_HOURS_RANGE.OPENS_AT,
    },
  ];

  return Object.fromEntries(
    Object.values(SEED_WEEKDAY).map((weekday) => [
      weekday,
      weekday === SEED_WEEKDAY.SUNDAY ? [] : openRange,
    ]),
  );
};

const seedPlans = async (firestore: Firestore): Promise<void> => {
  const plansCollection = firestore.collection(FIRESTORE_COLLECTION.PLANS);

  await plansCollection
    .doc(SEED_DOCUMENT_ID.PLAN_BASIC)
    .set(buildPlanDocument(SEED_PLAN.BASIC));
  await plansCollection
    .doc(SEED_DOCUMENT_ID.PLAN_PRO)
    .set(buildPlanDocument(SEED_PLAN.PRO));
};

const assertSlugIsNotReserved = (slug: string): void => {
  if (isReservedBusinessSlug(slug)) {
    throw new Error(`Reserved business slug: ${slug}`);
  }
};

const readSeedMsFromNow = (days: number): number =>
  Date.now() + days * SEED_SUBSCRIPTION_PERIOD.MS_PER_DAY;

const seedBusiness = async (firestore: Firestore): Promise<void> => {
  assertSlugIsNotReserved(SEED_BUSINESS.SLUG);

  const businessDocument = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(SEED_DOCUMENT_ID.BUSINESS);
  const currentPeriodEndsAt = Timestamp.fromMillis(
    readSeedMsFromNow(SEED_SUBSCRIPTION_PERIOD.DAYS),
  );

  await businessDocument.set({
    businessHours: buildBusinessHours(),
    currency: SEED_BUSINESS.CURRENCY,
    name: SEED_BUSINESS.NAME,
    ownerUserId: SEED_USER.SUBSCRIBER.UID,
    slug: SEED_BUSINESS.SLUG,
    status: BUSINESS_STATUS.ACTIVE,
    timeZone: SEED_BUSINESS.TIME_ZONE,
  });
  await businessDocument
    .collection(FIRESTORE_COLLECTION.SUBSCRIPTION)
    .doc(SEED_DOCUMENT_ID.SUBSCRIPTION)
    .set({
      cancelAtPeriodEnd: false,
      currentPeriodEndsAt,
      planId: SEED_DOCUMENT_ID.PLAN_PRO,
      status: SUBSCRIPTION_STATUS.ACTIVE,
    });

  const servicesCollection = businessDocument.collection(
    FIRESTORE_COLLECTION.SERVICES,
  );
  await servicesCollection
    .doc(SEED_DOCUMENT_ID.SERVICE_HAIRCUT)
    .set(buildServiceDocument(SEED_SERVICE.HAIRCUT));
  await servicesCollection
    .doc(SEED_DOCUMENT_ID.SERVICE_BEARD)
    .set(buildServiceDocument(SEED_SERVICE.BEARD));
  await servicesCollection
    .doc(SEED_DOCUMENT_ID.SERVICE_COLOR)
    .set(buildServiceDocument(SEED_SERVICE.COLOR));

  // Collaborator (Q1): serves haircuts and beard trims, and may manage every
  // booking and schedule block of the business (KAN-86).
  await businessDocument
    .collection(FIRESTORE_COLLECTION.COLLABORATORS)
    .doc(SEED_DOCUMENT_ID.COLLABORATOR)
    .set({
      email: SEED_USER.COLLABORATOR.EMAIL,
      fullName: SEED_USER.COLLABORATOR.FULL_NAME,
      permissions: [
        COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
        COLLABORATOR_PERMISSION.MANAGE_SCHEDULE_BLOCKS,
      ],
      phone: SEED_USER.COLLABORATOR.PHONE,
      serviceIds: [
        SEED_DOCUMENT_ID.SERVICE_HAIRCUT,
        SEED_DOCUMENT_ID.SERVICE_BEARD,
      ],
      status: COLLABORATOR_STATUS.ACTIVE,
      userId: SEED_USER.COLLABORATOR.UID,
    });
};

// Paid through the simulated checkout (KAN-22) and signed up (KAN-25), not
// approved yet (PROP-1): status pending, no Subscription.
const seedPendingBusiness = async (firestore: Firestore): Promise<void> => {
  assertSlugIsNotReserved(SEED_PENDING_BUSINESS.SLUG);

  const paidAt = Timestamp.now();
  const basicPlanPriceInCents = SEED_PLAN.BASIC.PRICE_IN_CENTS;

  await firestore
    .collection(FIRESTORE_COLLECTION.PLAN_CHECKOUTS)
    .doc(SEED_DOCUMENT_ID.PENDING_PLAN_CHECKOUT)
    .set({
      amountInCents: basicPlanPriceInCents,
      email: SEED_USER.PENDING_SUBSCRIBER.EMAIL,
      paidAt,
      planId: SEED_DOCUMENT_ID.PLAN_BASIC,
      signUpCompletedAt: paidAt,
    });

  const businessDocument = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(SEED_DOCUMENT_ID.PENDING_BUSINESS);

  await businessDocument.set({
    businessHours: buildBusinessHours(),
    currency: SEED_PENDING_BUSINESS.CURRENCY,
    name: SEED_PENDING_BUSINESS.NAME,
    ownerUserId: SEED_USER.PENDING_SUBSCRIBER.UID,
    planCheckoutId: SEED_DOCUMENT_ID.PENDING_PLAN_CHECKOUT,
    slug: SEED_PENDING_BUSINESS.SLUG,
    status: BUSINESS_STATUS.PENDING,
    timeZone: SEED_PENDING_BUSINESS.TIME_ZONE,
  });
  await businessDocument
    .collection(FIRESTORE_COLLECTION.PAYMENTS)
    .doc(SEED_DOCUMENT_ID.PENDING_BUSINESS_PAYMENT)
    .set({
      amountInCents: basicPlanPriceInCents,
      createdAt: paidAt,
      planId: SEED_DOCUMENT_ID.PLAN_BASIC,
      refundedAt: null,
      result: SEED_PAYMENT_RESULT.SUCCEEDED,
    });
};

const printCredentials = (): void => {
  console.log("\nEmulator seed done. Test credentials (emulator only):");
  const activeBusinessLabel = `${SEED_BUSINESS.NAME} (active)`;
  const pendingBusinessLabel = `${SEED_PENDING_BUSINESS.NAME} (pending)`;
  const credentialRows = [
    {
      business: SEED_TABLE_CELL.NONE,
      role: USER_ROLE.SUPER_ADMIN,
      seedUser: SEED_USER.SUPER_ADMIN,
    },
    {
      business: activeBusinessLabel,
      role: USER_ROLE.SUBSCRIBER,
      seedUser: SEED_USER.SUBSCRIBER,
    },
    {
      business: activeBusinessLabel,
      role: USER_ROLE.COLLABORATOR,
      seedUser: SEED_USER.COLLABORATOR,
    },
    {
      business: pendingBusinessLabel,
      role: USER_ROLE.SUBSCRIBER,
      seedUser: SEED_USER.PENDING_SUBSCRIBER,
    },
    {
      business: SEED_TABLE_CELL.NONE,
      role: USER_ROLE.CUSTOMER,
      seedUser: SEED_USER.CUSTOMER,
    },
  ].map(({ business, role, seedUser }) => ({
    business,
    email: seedUser.EMAIL,
    password: seedUser.PASSWORD,
    role,
  }));

  console.table(credentialRows);
  console.log(
    `Business: ${SEED_BUSINESS.NAME} (${SEED_DOCUMENT_ID.BUSINESS}), page /${SEED_BUSINESS.SLUG}`,
  );
  console.log(
    `Pending approval: ${SEED_PENDING_BUSINESS.NAME} (${SEED_DOCUMENT_ID.PENDING_BUSINESS}), slug ${SEED_PENDING_BUSINESS.SLUG}`,
  );
};

const seedEmulator = async (): Promise<void> => {
  const missingEmulatorHosts = readMissingEmulatorHosts();
  if (missingEmulatorHosts.length > 0) {
    console.error(
      `Refusing to seed: ${missingEmulatorHosts.join(", ")} not set. ` +
        "This script only runs against the Firebase Emulator Suite.",
    );
    process.exitCode = 1;
    return;
  }

  const firebaseApp = initializeApp({
    projectId: process.env[SEED_ENV_VAR.PROJECT_ID] ?? SEED_DEFAULT_PROJECT_ID,
  });
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  await upsertAuthUser(auth, SEED_USER.SUPER_ADMIN, {
    role: USER_ROLE.SUPER_ADMIN,
  });
  await upsertAuthUser(auth, SEED_USER.SUBSCRIBER, {
    businessId: SEED_DOCUMENT_ID.BUSINESS,
    role: USER_ROLE.SUBSCRIBER,
  });
  await upsertAuthUser(auth, SEED_USER.COLLABORATOR, {
    businessId: SEED_DOCUMENT_ID.BUSINESS,
    collaboratorId: SEED_DOCUMENT_ID.COLLABORATOR,
    role: USER_ROLE.COLLABORATOR,
  });
  await upsertAuthUser(auth, SEED_USER.PENDING_SUBSCRIBER, {
    businessId: SEED_DOCUMENT_ID.PENDING_BUSINESS,
    role: USER_ROLE.SUBSCRIBER,
  });
  await upsertAuthUser(auth, SEED_USER.CUSTOMER, { role: USER_ROLE.CUSTOMER });

  await writeUserProfile(firestore, SEED_USER.SUPER_ADMIN);
  await writeUserProfile(firestore, SEED_USER.SUBSCRIBER);
  await writeUserProfile(firestore, SEED_USER.COLLABORATOR);
  await writeUserProfile(firestore, SEED_USER.PENDING_SUBSCRIBER);
  await writeUserProfile(firestore, SEED_USER.CUSTOMER);

  await seedPlans(firestore);
  await seedBusiness(firestore);
  await seedPendingBusiness(firestore);

  printCredentials();
};

await seedEmulator();
