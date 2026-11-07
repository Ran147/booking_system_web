import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { FUNCTION_NAME, MONEY, type FunctionName } from "@/constants";
import type { Nullable } from "@/types";
import { firestore } from "./firebaseApp";

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

  throw new Error(`Cloud function "${functionName}" is not available.`);
};
