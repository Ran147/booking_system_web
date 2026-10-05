import { z } from "zod";
import { LANGUAGE } from "@/constants";

// Only the field sign-in needs from users/{userId} (AC-KAN-129-02). An
// unsupported or missing language is ignored.
export const UserLanguageDocumentSchema = z.object({
  language: z.enum([LANGUAGE.EN, LANGUAGE.ES]).nullish(),
});
