import { z } from "zod";
import { BUSINESS_PROFILE } from "@/constants";
import { BUSINESS_STATUS } from "./BusinessStatus.constants";
import { SOCIAL_NETWORK } from "./SocialNetwork.constants";

const nullableStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? null);

/** Validates the public fields stored in a Firestore business document. */
export const BusinessPublicProfileDocumentSchema = z.object({
  contactEmail: nullableStringSchema,
  contactPhone: nullableStringSchema,
  description: nullableStringSchema,
  logoUrl: nullableStringSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  socialLinks: z
    .array(
      z.object({
        network: z.enum(SOCIAL_NETWORK),
        url: z.url().refine((url) => url.startsWith("https://")),
      }),
    )
    .max(BUSINESS_PROFILE.SOCIAL_LINK_MAX_COUNT)
    .default([]),
  status: z.enum(BUSINESS_STATUS),
});
