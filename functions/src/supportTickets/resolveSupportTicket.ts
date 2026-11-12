import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { assertSuperAdmin } from "../shared/assertSuperAdmin.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { SUPPORT_TICKET_STATUS } from "../shared/constants/SupportTicketStatus.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";
import { RESOLVE_SUPPORT_TICKET_ERROR } from "./constants/ResolveSupportTicketError.constants.js";
import type {
  ResolveSupportTicketPayload,
  ResolveSupportTicketResponse,
} from "./models/ResolveSupportTicket.mutation.js";
import { resolveSupportTicketPayloadSchema } from "./models/ResolveSupportTicket.schema.js";

export const resolveSupportTicket = onCall<
  ResolveSupportTicketPayload,
  Promise<ResolveSupportTicketResponse>
>(async (request) => {
  assertSuperAdmin(request.auth);

  const { ticketId } = readPayload(
    resolveSupportTicketPayloadSchema,
    request.data,
    RESOLVE_SUPPORT_TICKET_ERROR.INVALID_PAYLOAD,
  );

  const ticketReference = firestore
    .collection(FIRESTORE_COLLECTION.SUPPORT_TICKETS)
    .doc(ticketId);

  const ticketSnapshot = await ticketReference.get();
  if (!ticketSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      RESOLVE_SUPPORT_TICKET_ERROR.TICKET_NOT_FOUND,
    );
  }

  const ticketData = ticketSnapshot.data();
  const now = new Date();

  if (ticketData?.status === SUPPORT_TICKET_STATUS.RESOLVED) {
    const existingResolvedDate = ticketData.resolvedAt?.toDate?.() ?? now;
    return {
      resolvedAt: existingResolvedDate.toISOString(),
      status: SUPPORT_TICKET_STATUS.RESOLVED,
      ticketId,
    };
  }

  await ticketReference.update({
    resolvedAt: Timestamp.fromDate(now),
    status: SUPPORT_TICKET_STATUS.RESOLVED,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    resolvedAt: now.toISOString(),
    status: SUPPORT_TICKET_STATUS.RESOLVED,
    ticketId,
  };
});
