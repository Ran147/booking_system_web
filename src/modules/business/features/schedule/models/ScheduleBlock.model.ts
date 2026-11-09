import { z } from "zod";
import type { Nullable } from "@/types";
import { SCHEDULE_CONSTANTS } from "../constants";

export interface ScheduleBlock {
  readonly businessId: string;
  readonly collaboratorId: Nullable<string>;
  readonly createdAt: Date;
  readonly endsAt: Date;
  readonly id: string;
  readonly isFullDay: boolean;
  readonly reason: Nullable<string>;
  readonly startsAt: Date;
  readonly updatedAt: Date;
}

export const scheduleBlockFormSchema = z
  .object({
    collaboratorId: z.string().nullable().optional(),
    endDate: z.string().min(1, "validation:required"),
    endTime: z.string().optional(),
    isFullDay: z.boolean().default(false),
    reason: z
      .string()
      .max(SCHEDULE_CONSTANTS.MAX_REASON_LENGTH, "validation:tooLong")
      .optional(),
    startDate: z.string().min(1, "validation:required"),
    startTime: z.string().optional(),
  })
  .refine(
    (values) => {
      if (values.isFullDay) {
        return values.startDate <= values.endDate;
      }
      if (!values.startTime || !values.endTime) {
        return true;
      }
      const startIso = `${values.startDate}T${values.startTime}`;
      const endIso = `${values.endDate}T${values.endTime}`;
      return startIso < endIso;
    },
    {
      message: "business:schedule.blocks.invalidRangeError",
      path: ["endDate"],
    },
  );

export type ScheduleBlockFormData = z.infer<typeof scheduleBlockFormSchema>;
