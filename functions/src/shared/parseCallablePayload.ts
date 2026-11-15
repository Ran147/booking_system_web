import type { z } from "zod";
import { CallableFailure } from "./CallableFailure.js";

// readPayload for the shared handlers (Q8): the same Zod check before any
// business rule, reported as a CallableFailure instead of an HttpsError.
export const parseCallablePayload = <PayloadSchema extends z.ZodType>(
  payloadSchema: PayloadSchema,
  payload: unknown,
  invalidPayloadMessage: string,
): z.output<PayloadSchema> => {
  const parseResult = payloadSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new CallableFailure("invalid-argument", invalidPayloadMessage);
  }
  return parseResult.data;
};
