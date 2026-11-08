import { z } from "zod";
import type { Booking, BookingStatus } from "@/domain";
import type { Nullable } from "@/types";
import { SCHEDULE_CONSTANTS } from "../constants";

export type ScheduleBookingItem = Booking;

export const createBookingFormSchema = z.object({
  collaboratorId: z.string().nullable().optional(),
  customerId: z.string().min(1, "validation:required"),
  date: z.string().min(1, "validation:required"),
  notes: z
    .string()
    .max(SCHEDULE_CONSTANTS.NOTE_MAX_LENGTH, "validation:tooLong")
    .optional(),
  serviceId: z.string().min(1, "validation:required"),
  time: z.string().min(1, "validation:required"),
});

export type CreateBookingFormData = z.infer<typeof createBookingFormSchema>;

export const rescheduleBookingFormSchema = z.object({
  date: z.string().min(1, "validation:required"),
  time: z.string().min(1, "validation:required"),
});

export type RescheduleBookingFormData = z.infer<
  typeof rescheduleBookingFormSchema
>;

export const cancelBookingFormSchema = z.object({
  isPenalized: z.boolean().default(false),
  note: z
    .string()
    .trim()
    .min(1, "validation:required")
    .max(SCHEDULE_CONSTANTS.CANCELLATION_NOTE_MAX_LENGTH, "validation:tooLong"),
});

export type CancelBookingFormData = z.infer<typeof cancelBookingFormSchema>;

export interface ActiveServiceOption {
  readonly durationMinutes: number;
  readonly id: string;
  readonly name: string;
  readonly priceInCents: number;
}

export interface BookingHistoryFilterValues {
  readonly collaboratorId?: Nullable<string>;
  readonly date?: string;
  readonly endDate?: string;
  readonly serviceId?: string;
  readonly startDate?: string;
  readonly status?: BookingStatus | "all";
}
