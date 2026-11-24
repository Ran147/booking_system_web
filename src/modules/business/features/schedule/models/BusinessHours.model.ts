import { z } from "zod";
import { SCHEDULE_CONSTANTS, type DayOfWeek } from "../constants";

export interface DayTimeRange {
  readonly closesAt: string;
  readonly opensAt: string;
}

export type BusinessHours = Record<DayOfWeek, readonly DayTimeRange[]>;

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const dayTimeRangeSchema = z
  .object({
    closesAt: z.string().regex(TIME_REGEX, "validation:invalidTime"),
    opensAt: z.string().regex(TIME_REGEX, "validation:invalidTime"),
  })
  .refine((range) => range.opensAt < range.closesAt, {
    message: "business:schedule.hours.invalidRangeError",
    path: ["closesAt"],
  });

export const dayHoursArraySchema = z
  .array(dayTimeRangeSchema)
  .max(
    SCHEDULE_CONSTANTS.MAX_HOURS_RANGES_PER_DAY,
    "business:schedule.hours.maxRangesError",
  )
  .refine(
    (ranges) => {
      if (ranges.length <= 1) {
        return true;
      }
      const firstRange = ranges[0];
      const secondRange = ranges[1];
      if (!firstRange || !secondRange) {
        return true;
      }
      return firstRange.closesAt <= secondRange.opensAt;
    },
    {
      message: "business:schedule.hours.overlappingRangesError",
    },
  );

export const businessHoursFormSchema = z.object({
  friday: dayHoursArraySchema,
  monday: dayHoursArraySchema,
  saturday: dayHoursArraySchema,
  sunday: dayHoursArraySchema,
  thursday: dayHoursArraySchema,
  tuesday: dayHoursArraySchema,
  wednesday: dayHoursArraySchema,
});

export type BusinessHoursFormData = z.infer<typeof businessHoursFormSchema>;
