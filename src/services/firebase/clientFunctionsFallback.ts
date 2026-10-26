import {
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { FUNCTION_NAME, MONEY, TIME_MS, type FunctionName } from "@/constants";
import type { Nullable } from "@/types";
import { auth, firestore } from "./firebaseApp";

interface GenericPayload {
  readonly [key: string]: unknown;
}

const handleCheckBusinessSlugFallback = async (
  payload: GenericPayload,
): Promise<{ readonly isAvailable: boolean }> => {
  const rawSlug = String(payload.slug ?? "").toLowerCase();
  const slugDocument = await getDoc(doc(firestore, "businessSlugs", rawSlug));
  return { isAvailable: !slugDocument.exists() };
};

const handleValidateSignUpLinkFallback = async (
  payload: GenericPayload,
): Promise<{
  readonly amountInCents: number;
  readonly billingPeriod: string;
  readonly checkoutEmail: string;
  readonly email: string;
  readonly planName: string;
}> => {
  const rawToken = String(payload.signUpToken ?? "");
  const decodedToken = decodeURIComponent(rawToken);
  const fallbackEmail = decodedToken.includes("@")
    ? decodedToken
    : "nuevo-negocio@demo.com";

  return {
    amountInCents: 2900,
    billingPeriod: "monthly",
    checkoutEmail: fallbackEmail,
    email: fallbackEmail,
    planName: "Plan Profesional",
  };
};

const handleCompleteSubscriberSignUpFallback = async (
  payload: GenericPayload,
): Promise<{ readonly email: string }> => {
  const email = String(
    payload.email ?? payload.signUpToken ?? "nuevo-negocio@demo.com",
  );
  const password = String(payload.password ?? "Password123!");
  const fullName = String(payload.fullName ?? "Nuevo Negocio");
  const businessName = String(payload.businessName ?? "Mi Nuevo Negocio");
  const businessSlug = String(
    payload.businessSlug ?? "mi-nuevo-negocio",
  ).toLowerCase();
  const phone = payload.phone ? String(payload.phone) : null;
  const businessId = `business-${businessSlug}`;

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const userId = userCredential.user.uid;

  await updateProfile(userCredential.user, { displayName: fullName });

  const currentPeriodEndsAt = Timestamp.fromMillis(
    Date.now() + TIME_MS.THIRTY_DAYS,
  );

  const businessDocumentReference = doc(firestore, "businesses", businessId);

  await setDoc(
    businessDocumentReference,
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

  const batch = writeBatch(firestore);

  batch.set(
    doc(firestore, "users", userId),
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

  batch.set(
    doc(firestore, "businesses", businessId, "subscription", "current"),
    {
      cancelAtPeriodEnd: false,
      currentPeriodEndsAt,
      planId: "plan-pro",
      status: "active",
    },
  );

  batch.set(doc(firestore, "businesses", businessId, "collaborators", userId), {
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

  batch.set(
    doc(firestore, "businesses", businessId, "services", "service-default"),
    {
      description: "Standard service",
      discounts: [],
      durationMinutes: 30,
      name: "Standard Service",
      priceInCents: 20000,
      status: "active",
    },
  );

  batch.set(doc(firestore, "businessSlugs", businessSlug), {
    businessId,
    createdAt: Timestamp.now(),
  });

  await batch.commit();

  await signOut(auth);

  return { email };
};

export const executeClientFunctionsFallback = async <Payload, Response>(
  functionName: FunctionName,
  payload: Payload,
): Promise<Response> => {
  const genericPayload = (payload ?? {}) as GenericPayload;

  if (functionName === FUNCTION_NAME.CHECK_BUSINESS_SLUG) {
    const slugResult = await handleCheckBusinessSlugFallback(genericPayload);
    return slugResult as Response;
  }

  if (functionName === FUNCTION_NAME.VALIDATE_SIGN_UP_LINK) {
    const linkResult = await handleValidateSignUpLinkFallback(genericPayload);
    return linkResult as Response;
  }

  if (functionName === FUNCTION_NAME.COMPLETE_SUBSCRIBER_SIGN_UP) {
    const signUpResult =
      await handleCompleteSubscriberSignUpFallback(genericPayload);
    return signUpResult as Response;
  }

  if (functionName === FUNCTION_NAME.VERIFY_RECAPTCHA) {
    return { isVerified: true } as Response;
  }

  if (functionName === FUNCTION_NAME.REQUEST_PASSWORD_RESET) {
    return { isRequested: true } as Response;
  }

  if (functionName === FUNCTION_NAME.DELETE_SERVICE) {
    const businessId = String(genericPayload.businessId ?? "");
    const serviceId = String(genericPayload.serviceId ?? "");

    if (!businessId || !serviceId) {
      throw new Error("Missing businessId or serviceId for deleteService");
    }

    const serviceDocumentReference = doc(
      firestore,
      "businesses",
      businessId,
      "services",
      serviceId,
    );

    await deleteDoc(serviceDocumentReference);
    return { deletedServiceId: serviceId } as Response;
  }

  if (functionName === FUNCTION_NAME.CREATE_SERVICE) {
    const businessId = String(genericPayload.businessId ?? "");
    const formValues = (genericPayload.formValues ?? {}) as {
      description?: string;
      durationMinutes?: number;
      features?: string[];
      imageUrl?: Nullable<string>;
      name?: string;
      price?: number;
    };
    const sanitizedFeatures = (formValues.features ?? [])
      .map((feature) => feature.trim())
      .filter((feature) => feature.length > 0);
    const priceInCents = Math.round(
      Number(formValues.price || 0) * MONEY.CENTS_PER_UNIT,
    );
    const servicesCollectionReference = collection(
      firestore,
      "businesses",
      businessId,
      "services",
    );
    const documentReference = await addDoc(servicesCollectionReference, {
      createdAt: Timestamp.now(),
      description: (formValues.description || "").trim(),
      durationMinutes: Number(formValues.durationMinutes ?? 0),
      features: sanitizedFeatures,
      imageUrl: formValues.imageUrl ?? null,
      name: (formValues.name || "").trim(),
      priceInCents,
      searchName: (formValues.name || "").trim().toLowerCase(),
      status: "active",
      updatedAt: Timestamp.now(),
    });
    return { serviceId: documentReference.id } as Response;
  }

  if (functionName === FUNCTION_NAME.UPDATE_SERVICE) {
    const businessId = String(genericPayload.businessId ?? "");
    const serviceId = String(genericPayload.serviceId ?? "");
    const formValues = (genericPayload.formValues ?? {}) as {
      description?: string;
      durationMinutes?: number;
      features?: string[];
      imageUrl?: Nullable<string>;
      name?: string;
      price?: number;
    };
    const sanitizedFeatures = (formValues.features ?? [])
      .map((feature) => feature.trim())
      .filter((feature) => feature.length > 0);
    const priceInCents = Math.round(
      Number(formValues.price || 0) * MONEY.CENTS_PER_UNIT,
    );
    const serviceDocumentReference = doc(
      firestore,
      "businesses",
      businessId,
      "services",
      serviceId,
    );
    await updateDoc(serviceDocumentReference, {
      description: (formValues.description || "").trim(),
      durationMinutes: Number(formValues.durationMinutes ?? 0),
      features: sanitizedFeatures,
      imageUrl: formValues.imageUrl ?? null,
      name: (formValues.name || "").trim(),
      priceInCents,
      searchName: (formValues.name || "").trim().toLowerCase(),
      updatedAt: Timestamp.now(),
    });
    return { serviceId } as Response;
  }

  throw new Error(`Cloud function "${functionName}" is not available.`);
};
