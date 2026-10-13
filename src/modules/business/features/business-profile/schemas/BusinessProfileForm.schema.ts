import { z } from "zod";
import { BUSINESS_PROFILE, VALIDATION_MESSAGE_KEY } from "@/constants";

const optionalHttpsUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^https:\/\/[^\s]+$/u.test(value),
    VALIDATION_MESSAGE_KEY.URL_INVALID,
  );

export const BusinessProfileFormSchema = z.object({
  contactEmail: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      VALIDATION_MESSAGE_KEY.EMAIL_INVALID,
    ),
  contactPhone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || BUSINESS_PROFILE.PHONE_PATTERN.test(value),
      VALIDATION_MESSAGE_KEY.PHONE_INVALID,
    ),
  description: z
    .string()
    .trim()
    .max(
      BUSINESS_PROFILE.DESCRIPTION_MAX_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ),
  facebookUrl: optionalHttpsUrlSchema,
  instagramUrl: optionalHttpsUrlSchema,
  logoFile: z
    .custom<FileList>()
    .optional()
    .refine((files) => {
      const file = files?.item(0);
      return (
        !file ||
        BUSINESS_PROFILE.VALID_LOGO_TYPES.some(
          (validLogoType) => validLogoType === file.type,
        )
      );
    }, VALIDATION_MESSAGE_KEY.FILE_INVALID)
    .refine(
      (files) =>
        !files?.item(0) ||
        (files.item(0)?.size ?? 0) <= BUSINESS_PROFILE.LOGO_MAX_BYTES,
      VALIDATION_MESSAGE_KEY.FILE_INVALID,
    ),
  name: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .max(BUSINESS_PROFILE.NAME_MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG),
  tiktokUrl: optionalHttpsUrlSchema,
  websiteUrl: optionalHttpsUrlSchema,
  whatsappUrl: optionalHttpsUrlSchema,
});
