import { z } from "zod";
import { LANGUAGE } from "@/constants";

export const UserLanguageDocumentSchema = z.object({
  language: z
    .enum(LANGUAGE)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
});
