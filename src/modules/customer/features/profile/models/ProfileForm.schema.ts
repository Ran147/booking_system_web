import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { FULL_NAME_RULE, isValidPhone } from "@/domain";

export const profileFormSchema = z.object({
  fullName: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .min(FULL_NAME_RULE.MIN_LENGTH, VALIDATION_MESSAGE_KEY.TOO_SHORT)
    .max(FULL_NAME_RULE.MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG),

  phone: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .refine(isValidPhone, VALIDATION_MESSAGE_KEY.PHONE_INVALID),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
