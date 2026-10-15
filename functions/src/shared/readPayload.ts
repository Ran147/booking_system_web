import { HttpsError } from "firebase-functions/v2/https";
import type { z } from "zod";

// Parses request.data with the function's schema before anything else runs
// (cloud-functions-standards §3). A payload that fails the schema never reaches
// the business rules.
export const readPayload = <PayloadSchema extends z.ZodType>(
  payloadSchema: PayloadSchema,
  payload: unknown,
  invalidPayloadMessage: string,
): z.output<PayloadSchema> => {
  const parseResult = payloadSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new HttpsError("invalid-argument", invalidPayloadMessage);
  }
  return parseResult.data;
};
