import { z } from "zod";
import { STRING, VALIDATION_MESSAGE_KEY } from "@/constants";
import type { Nullable } from "@/types";
import {
  SERVICE_FEATURE_LIMIT,
  SERVICE_FIELD_LIMIT,
} from "../constants/ServiceForm.constants";

export const serviceFormSchema = z.object({
  description: z
    .string()
    .max(
      SERVICE_FIELD_LIMIT.DESCRIPTION_MAX_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    )
    .default(STRING.EMPTY),
  durationMinutes: z
    .number({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .int(VALIDATION_MESSAGE_KEY.OUT_OF_RANGE)
    .min(
      SERVICE_FIELD_LIMIT.DURATION_MIN_MINUTES,
      VALIDATION_MESSAGE_KEY.OUT_OF_RANGE,
    )
    .max(
      SERVICE_FIELD_LIMIT.DURATION_MAX_MINUTES,
      VALIDATION_MESSAGE_KEY.OUT_OF_RANGE,
    ),
  features: z
    .array(
      z
        .string()
        .max(
          SERVICE_FEATURE_LIMIT.ITEM_MAX_LENGTH,
          VALIDATION_MESSAGE_KEY.TOO_LONG,
        ),
    )
    .max(SERVICE_FEATURE_LIMIT.MAX_ITEMS)
    .default([]),
  imageUrl: z.custom<Nullable<string>>().default(null),
  name: z
    .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .min(SERVICE_FIELD_LIMIT.NAME_MIN_LENGTH, VALIDATION_MESSAGE_KEY.TOO_SHORT)
    .max(SERVICE_FIELD_LIMIT.NAME_MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG),
  price: z
    .number({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
    .min(SERVICE_FIELD_LIMIT.PRICE_MIN, VALIDATION_MESSAGE_KEY.OUT_OF_RANGE),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
