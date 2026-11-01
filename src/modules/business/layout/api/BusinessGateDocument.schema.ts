import { Timestamp } from "firebase/firestore";
import { z } from "zod";
import { BUSINESS_STATUS } from "@/domain";

// Only the fields the status gate needs from businesses/{businessId} (D-2).
export const BusinessGateDocumentSchema = z.object({
  createdAt: z
    .custom<Timestamp>((value) => value instanceof Timestamp)
    .nullish(),
  name: z.string().min(1),
  rejectionReason: z.string().nullish(),
  status: z.enum(BUSINESS_STATUS),
  timeZone: z.string().nullish(),
});
