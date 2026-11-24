import { z } from "zod";
import type { BusinessHours } from "../models";

const timeRangeSchema = z.object({
  closesAt: z.string(),
  opensAt: z.string(),
});

export const businessHoursDocumentSchema = z
  .object({
    friday: z.array(timeRangeSchema).default([]),
    monday: z.array(timeRangeSchema).default([]),
    saturday: z.array(timeRangeSchema).default([]),
    sunday: z.array(timeRangeSchema).default([]),
    thursday: z.array(timeRangeSchema).default([]),
    tuesday: z.array(timeRangeSchema).default([]),
    wednesday: z.array(timeRangeSchema).default([]),
  })
  .default({
    friday: [],
    monday: [],
    saturday: [],
    sunday: [],
    thursday: [],
    tuesday: [],
    wednesday: [],
  });

export const mapBusinessHours = (rawHoursInput: unknown): BusinessHours => {
  return businessHoursDocumentSchema.parse(rawHoursInput || {});
};
