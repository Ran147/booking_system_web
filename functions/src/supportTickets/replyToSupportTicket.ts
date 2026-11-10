import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { assertSuperAdmin } from "../shared/assertSuperAdmin.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { SUPPORT_TICKET_STATUS } from "../shared/constants/SupportTicketStatus.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";
import { REPLY_TO_SUPPORT_TICKET_ERROR } from "./constants/ReplyToSupportTicketError.constants.js";
import { SUPPORT_TICKET_ENV_FLAG } from "./constants/SupportTicketLimits.constants.js";
import type {
  ReplyToSupportTicketPayload,
  ReplyToSupportTicketResponse,
} from "./models/ReplyToSupportTicket.mutation.js";
import { replyToSupportTicketPayloadSchema } from "./models/ReplyToSupportTicket.schema.js";

export const replyToSupportTicket = onCall<
  ReplyToSupportTicketPayload,
  Promise<ReplyToSupportTicketResponse>
>(async (request) => {
  assertSuperAdmin(request.auth);

  const { body, ticketId } = readPayload(
    replyToSupportTicketPayloadSchema,
    request.data,
    REPLY_TO_SUPPORT_TICKET_ERROR.INVALID_PAYLOAD,
  );

  const ticketReference = firestore
    .collection(FIRESTORE_COLLECTION.SUPPORT_TICKETS)
    .doc(ticketId);

  const ticketSnapshot = await ticketReference.get();
  if (!ticketSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      REPLY_TO_SUPPORT_TICKET_ERROR.TICKET_NOT_FOUND,
    );
  }

  const ticketData = ticketSnapshot.data();
  if (ticketData?.status === SUPPORT_TICKET_STATUS.RESOLVED) {
    throw new HttpsError(
      "failed-precondition",
      REPLY_TO_SUPPORT_TICKET_ERROR.ALREADY_RESOLVED,
    );
  }

  const callerUid = request.auth?.uid ?? "admin-user";
  const callerEmail =
    typeof request.auth?.token?.email === "string"
      ? request.auth.token.email
      : "support@platform.com";

  let emailFailed = false;
  if (
    !ticketData?.ownerEmail ||
    process.env.SIMULATE_EMAIL_FAILURE === SUPPORT_TICKET_ENV_FLAG.TRUE
  ) {
    emailFailed = true;
  }

  const replyId = randomUUID();
  const now = new Date();
  const newReply = {
    body,
    emailFailed,
    id: replyId,
    sentAt: Timestamp.fromDate(now),
    sentByEmail: callerEmail,
    sentByUserId: callerUid,
  };

  const nextStatus =
    ticketData?.status === SUPPORT_TICKET_STATUS.OPEN
      ? SUPPORT_TICKET_STATUS.IN_PROGRESS
      : (ticketData?.status ?? SUPPORT_TICKET_STATUS.IN_PROGRESS);

  await ticketReference.update({
    replies: FieldValue.arrayUnion(newReply),
    status: nextStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    reply: {
      body: newReply.body,
      emailFailed: newReply.emailFailed,
      id: newReply.id,
      sentAt: now.toISOString(),
      sentByEmail: newReply.sentByEmail,
      sentByUserId: newReply.sentByUserId,
    },
    status: nextStatus,
  };
});
