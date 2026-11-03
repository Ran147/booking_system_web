import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { assertRecaptcha, RECAPTCHA_SECRETS } from "../auth/assertRecaptcha.js";
import { firestore } from "../shared/firebaseAdmin.js";
import type {
  SendContactMessagePayload,
  SendContactMessageResponse,
} from "./models/SendContactMessage.mutation.js";
import { sendContactMessageSchema } from "./models/SendContactMessage.schema.js";

const readSendContactMessagePayload = (
  rawPayload: unknown,
): SendContactMessagePayload => {
  const parseResult = sendContactMessageSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid contact message payload.",
    );
  }
  return parseResult.data;
};

export const sendContactMessage = onCall<
  SendContactMessagePayload,
  Promise<SendContactMessageResponse>
>({ secrets: RECAPTCHA_SECRETS }, async (request) => {
  const payload = readSendContactMessagePayload(request.data);
  await assertRecaptcha(payload.recaptchaToken);

  await firestore.collection("contactMessages").add({
    createdAt: FieldValue.serverTimestamp(),
    email: payload.email,
    message: payload.message,
    name: payload.name,
    status: "unread",
    subject: payload.subject,
  });

  return { isSent: true };
});
