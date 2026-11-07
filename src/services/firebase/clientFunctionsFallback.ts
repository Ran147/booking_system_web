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
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { FUNCTION_NAME, MONEY, TIME_MS, type FunctionName } from "@/constants";
import {
  BOOKING_STATUS,
  BUSINESS_STATUS,
  CANCELLATION_ACTOR,
  CUSTOMER_STATUS,
  SERVICE_STATUS,
} from "@/domain";
import {
  BOOKING_CONFIRMATION_MODE,
  SCHEDULE_CONSTANTS,
} from "@/modules/business/features/schedule";
import type { Nullable } from "@/types";
import { auth, firestore } from "./firebaseApp";

const MILLISECONDS_IN_MINUTE = 60_000;

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

  if (functionName === FUNCTION_NAME.SEND_CONTACT_MESSAGE) {
    return { isSent: true } as Response;
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

  if (functionName === FUNCTION_NAME.CREATE_BOOKING) {
    const businessId = String(genericPayload.businessId ?? "");
    const serviceId = String(genericPayload.serviceId ?? "");
    const customerId = String(genericPayload.customerId ?? "");
    const collaboratorId = genericPayload.collaboratorId
      ? String(genericPayload.collaboratorId)
      : null;
    const startsAt = String(
      genericPayload.startsAt ?? new Date().toISOString(),
    );
    const endsAt = genericPayload.endsAt ? String(genericPayload.endsAt) : null;

    const businessDocument = await getDoc(
      doc(firestore, "businesses", businessId),
    );
    if (!businessDocument.exists()) {
      throw new Error("business_unavailable");
    }
    const businessDetails = businessDocument.data();
    if (
      businessDetails?.status &&
      businessDetails.status !== BUSINESS_STATUS.ACTIVE
    ) {
      throw new Error("business_unavailable");
    }

    const serviceDocument = await getDoc(
      doc(firestore, "businesses", businessId, "services", serviceId),
    );
    if (!serviceDocument.exists()) {
      throw new Error("service_unavailable");
    }
    const serviceDetails = serviceDocument.data();
    if (
      serviceDetails?.status &&
      serviceDetails.status !== SERVICE_STATUS.ACTIVE
    ) {
      throw new Error("service_unavailable");
    }

    if (customerId) {
      const customerDocument = await getDoc(
        doc(firestore, "businesses", businessId, "customers", customerId),
      );
      if (
        customerDocument.exists() &&
        customerDocument.data()?.status === CUSTOMER_STATUS.BLOCKED
      ) {
        throw new Error("customer_blocked");
      }
    }

    let collaboratorName: Nullable<string> = null;
    if (collaboratorId) {
      const collaboratorDocument = await getDoc(
        doc(
          firestore,
          "businesses",
          businessId,
          "collaborators",
          collaboratorId,
        ),
      );
      if (collaboratorDocument.exists()) {
        collaboratorName =
          (collaboratorDocument.data()?.fullName as string) || null;
      }
    }

    const durationMinutes = Number(
      serviceDetails.durationMinutes ||
        SCHEDULE_CONSTANTS.DEFAULT_SLOT_DURATION_MINUTES,
    );
    const startsAtDate = new Date(startsAt);
    const endsAtDate = endsAt
      ? new Date(endsAt)
      : new Date(
          startsAtDate.getTime() + durationMinutes * MILLISECONDS_IN_MINUTE,
        );

    const bookingsCollectionReference = collection(
      firestore,
      "businesses",
      businessId,
      "bookings",
    );
    const bookingsSnapshot = await getDocs(
      query(
        bookingsCollectionReference,
        where("status", "in", [
          BOOKING_STATUS.PENDING,
          BOOKING_STATUS.CONFIRMED,
        ]),
      ),
    );

    const hasBookingCollision = bookingsSnapshot.docs.some((bookingDoc) => {
      const bookingDetails = bookingDoc.data();
      if (
        collaboratorId &&
        bookingDetails.collaboratorId &&
        bookingDetails.collaboratorId !== collaboratorId
      ) {
        return false;
      }
      const existingStart = bookingDetails.startsAt?.toDate
        ? bookingDetails.startsAt.toDate()
        : new Date(bookingDetails.startsAt);
      const existingEnd = bookingDetails.endsAt?.toDate
        ? bookingDetails.endsAt.toDate()
        : new Date(bookingDetails.endsAt);
      return startsAtDate < existingEnd && endsAtDate > existingStart;
    });

    if (hasBookingCollision) {
      throw new Error("slot_taken");
    }

    const blocksCollectionReference = collection(
      firestore,
      "businesses",
      businessId,
      "scheduleBlocks",
    );
    const blocksSnapshot = await getDocs(blocksCollectionReference);
    const hasBlockCollision = blocksSnapshot.docs.some((blockDoc) => {
      const blockDetails = blockDoc.data();
      if (
        collaboratorId &&
        blockDetails.collaboratorId &&
        blockDetails.collaboratorId !== collaboratorId
      ) {
        return false;
      }
      const blockStart = blockDetails.startsAt?.toDate
        ? blockDetails.startsAt.toDate()
        : new Date(blockDetails.startsAt);
      const blockEnd = blockDetails.endsAt?.toDate
        ? blockDetails.endsAt.toDate()
        : new Date(blockDetails.endsAt);
      return startsAtDate < blockEnd && endsAtDate > blockStart;
    });

    if (hasBlockCollision) {
      throw new Error("slot_taken");
    }

    const confirmationMode =
      businessDetails.bookingConfirmationMode ||
      BOOKING_CONFIRMATION_MODE.AUTOMATIC;
    const initialStatus =
      confirmationMode === BOOKING_CONFIRMATION_MODE.MANUAL
        ? BOOKING_STATUS.PENDING
        : BOOKING_STATUS.CONFIRMED;

    const serviceSnapshotData = {
      discounts: serviceDetails.discounts || [],
      durationMinutes,
      name: String(serviceDetails.name || "Servicio"),
      priceInCents: Number(serviceDetails.priceInCents || 0),
    };

    const documentReference = await addDoc(bookingsCollectionReference, {
      businessId,
      cancellation: null,
      collaboratorId,
      collaboratorName,
      createdAt: Timestamp.now(),
      customerId,
      customerUserId: customerId,
      endsAt: Timestamp.fromDate(endsAtDate),
      notes: genericPayload.notes ? String(genericPayload.notes) : null,
      rescheduleHistory: [],
      serviceId,
      serviceSnapshot: serviceSnapshotData,
      startsAt: Timestamp.fromDate(startsAtDate),
      status: initialStatus,
      updatedAt: Timestamp.now(),
    });

    return {
      bookingId: documentReference.id,
      status: initialStatus,
    } as Response;
  }

  if (functionName === FUNCTION_NAME.CANCEL_BOOKING) {
    const businessId = String(genericPayload.businessId ?? "");
    const bookingId = String(genericPayload.bookingId ?? "");
    const note = String(genericPayload.note ?? "").trim();
    const isPenalized = Boolean(genericPayload.isPenalized);
    const cancelledBy = String(
      genericPayload.cancelledBy ?? CANCELLATION_ACTOR.BUSINESS,
    );

    if (!note) {
      throw new Error("note is required");
    }

    const bookingDocumentReference = doc(
      firestore,
      "businesses",
      businessId,
      "bookings",
      bookingId,
    );
    const bookingDocument = await getDoc(bookingDocumentReference);
    if (!bookingDocument.exists()) {
      throw new Error("not-found");
    }

    const bookingDetails = bookingDocument.data();
    if (
      bookingDetails.status !== BOOKING_STATUS.PENDING &&
      bookingDetails.status !== BOOKING_STATUS.CONFIRMED
    ) {
      throw new Error("invalid_transition");
    }

    await updateDoc(bookingDocumentReference, {
      cancellation: {
        cancelledAt: Timestamp.now(),
        cancelledBy,
        isPenalized,
        note,
      },
      status: BOOKING_STATUS.CANCELLED,
      updatedAt: Timestamp.now(),
    });

    return {
      bookingId,
      status: BOOKING_STATUS.CANCELLED,
    } as Response;
  }

  if (functionName === FUNCTION_NAME.RESCHEDULE_BOOKING) {
    const businessId = String(genericPayload.businessId ?? "");
    const bookingId = String(genericPayload.bookingId ?? "");
    const newStartsAt = String(genericPayload.newStartsAt ?? "");

    const bookingDocumentReference = doc(
      firestore,
      "businesses",
      businessId,
      "bookings",
      bookingId,
    );
    const bookingDocument = await getDoc(bookingDocumentReference);
    if (!bookingDocument.exists()) {
      throw new Error("not-found");
    }

    const bookingDetails = bookingDocument.data();
    if (
      bookingDetails.status !== BOOKING_STATUS.PENDING &&
      bookingDetails.status !== BOOKING_STATUS.CONFIRMED
    ) {
      throw new Error("cannot_reschedule");
    }

    const currentStartsAtDate = bookingDetails.startsAt?.toDate
      ? bookingDetails.startsAt.toDate()
      : new Date(bookingDetails.startsAt);

    if (currentStartsAtDate.getTime() <= Date.now()) {
      throw new Error("cannot_reschedule_past");
    }

    const newStartsAtDate = new Date(newStartsAt);
    if (newStartsAtDate.getTime() <= Date.now()) {
      throw new Error("slot_in_past");
    }

    const durationMinutes = Number(
      bookingDetails.serviceSnapshot?.durationMinutes ||
        SCHEDULE_CONSTANTS.DEFAULT_SLOT_DURATION_MINUTES,
    );
    const newEndsAtDate = new Date(
      newStartsAtDate.getTime() + durationMinutes * MILLISECONDS_IN_MINUTE,
    );

    const bookingsCollectionReference = collection(
      firestore,
      "businesses",
      businessId,
      "bookings",
    );
    const bookingsSnapshot = await getDocs(
      query(
        bookingsCollectionReference,
        where("status", "in", ["pending", "confirmed"]),
      ),
    );

    const hasCollision = bookingsSnapshot.docs.some((candidateDoc) => {
      if (candidateDoc.id === bookingId) {
        return false;
      }
      const candidateDetails = candidateDoc.data();
      if (
        bookingDetails.collaboratorId &&
        candidateDetails.collaboratorId &&
        candidateDetails.collaboratorId !== bookingDetails.collaboratorId
      ) {
        return false;
      }
      const start = candidateDetails.startsAt?.toDate
        ? candidateDetails.startsAt.toDate()
        : new Date(candidateDetails.startsAt);
      const end = candidateDetails.endsAt?.toDate
        ? candidateDetails.endsAt.toDate()
        : new Date(candidateDetails.endsAt);
      return newStartsAtDate < end && newEndsAtDate > start;
    });

    if (hasCollision) {
      throw new Error("slot_taken");
    }

    const rescheduleHistory = Array.isArray(bookingDetails.rescheduleHistory)
      ? [...bookingDetails.rescheduleHistory]
      : [];

    rescheduleHistory.push({
      changedAt: Timestamp.now(),
      previousEndsAt: bookingDetails.endsAt,
      previousStartsAt: bookingDetails.startsAt,
    });

    await updateDoc(bookingDocumentReference, {
      endsAt: Timestamp.fromDate(newEndsAtDate),
      rescheduleHistory,
      startsAt: Timestamp.fromDate(newStartsAtDate),
      updatedAt: Timestamp.now(),
    });

    return {
      bookingId,
      endsAt: newEndsAtDate.toISOString(),
      startsAt: newStartsAtDate.toISOString(),
    } as Response;
  }

  if (functionName === FUNCTION_NAME.UPDATE_BOOKING_STATUS) {
    const businessId = String(genericPayload.businessId ?? "");
    const bookingId = String(genericPayload.bookingId ?? "");
    const status = String(genericPayload.status ?? "");

    const bookingDocumentReference = doc(
      firestore,
      "businesses",
      businessId,
      "bookings",
      bookingId,
    );
    await updateDoc(bookingDocumentReference, {
      status,
      updatedAt: Timestamp.now(),
    });

    return {
      bookingId,
      status,
    } as Response;
  }

  throw new Error(`Cloud function "${functionName}" is not available.`);
};
