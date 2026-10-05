import { STRING } from "@/constants";
import { SERVICE_FIELD_LIMIT } from "./ServiceForm.constants";
import type { ServiceFormValues } from "../models/ServiceForm.schema";

export const DEFAULT_SERVICE_FORM_VALUES: ServiceFormValues = Object.freeze({
  description: STRING.EMPTY,
  durationMinutes: SERVICE_FIELD_LIMIT.DURATION_MIN_MINUTES,
  features: Object.freeze([]) as unknown as string[],
  imageUrl: null,
  name: STRING.EMPTY,
  price: 0,
});
