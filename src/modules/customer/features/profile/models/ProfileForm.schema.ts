import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import {
  PROFILE_FIELD_LIMIT,
  PROFILE_PHONE_DIGIT_PATTERN,
  PROFILE_PHONE_INVALID_MESSAGE_KEY,
  PROFILE_PHONE_PATTERN,
} from "../constants";

export const profileFormSchema = z.object({
  fullName: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .min(
      PROFILE_FIELD_LIMIT.FULL_NAME_MIN_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_SHORT,
    )
    .max(
      PROFILE_FIELD_LIMIT.FULL_NAME_MAX_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ),
  phone: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .max(PROFILE_FIELD_LIMIT.PHONE_MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG)
    .refine((phone) => {
      const digitCount = phone.match(PROFILE_PHONE_DIGIT_PATTERN)?.length ?? 0;
      return (
        PROFILE_PHONE_PATTERN.test(phone) &&
        digitCount >= PROFILE_FIELD_LIMIT.PHONE_MIN_DIGITS &&
        digitCount <= PROFILE_FIELD_LIMIT.PHONE_MAX_DIGITS
      );
    }, PROFILE_PHONE_INVALID_MESSAGE_KEY),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
