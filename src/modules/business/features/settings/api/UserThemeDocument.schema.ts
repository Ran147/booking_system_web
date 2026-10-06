import { z } from "zod";
import { THEME_MODE } from "@/constants";

export const UserThemeDocumentSchema = z.object({
  theme: z
    .enum(THEME_MODE)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
});
