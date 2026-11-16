import { FieldValue } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { CREATE_SUPPORT_TICKET_ERROR } from "./constants/CreateSupportTicketError.constants.js";
import type {
  CreateSupportTicketPayload,
  CreateSupportTicketResponse,
} from "./models/CreateSupportTicket.mutation.js";
import { createSupportTicketPayloadSchema } from "./models/CreateSupportTicket.schema.js";
import { assertSubscriberOf } from "../shared/assertSubscriberOf.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { SUPPORT_TICKET_STATUS } from "../shared/constants/SupportTicketStatus.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";

export const createSupportTicket = onCall<
  CreateSupportTicketPayload,
  Promise<CreateSupportTicketResponse>
>(async (request) => {
  const { businessId, message, subject } = readPayload(
    createSupportTicketPayloadSchema,
    request.data,
    CREATE_SUPPORT_TICKET_ERROR.INVALID_PAYLOAD,
  );

  assertSubscriberOf(request.auth, businessId);

  const businessSnapshot = await firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId)
    .get();

  const businessName =
    typeof businessSnapshot.data()?.name === "string"
      ? (businessSnapshot.data()?.name as string)
      : "";

  const ownerEmail =
    typeof request.auth?.token?.email === "string"
      ? request.auth.token.email
      : null;

  const ticketReference = firestore
    .collection(FIRESTORE_COLLECTION.SUPPORT_TICKETS)
    .doc();

  const now = FieldValue.serverTimestamp();

  await ticketReference.set({
    businessId,
    businessName,
    createdAt: now,
    createdByUserId: request.auth?.uid ?? "",
    message,
    ownerEmail,
    replies: [],
    resolvedAt: null,
    status: SUPPORT_TICKET_STATUS.OPEN,
    subject,
    updatedAt: now,
  });

  return {
    ticketId: ticketReference.id,
  };
});
