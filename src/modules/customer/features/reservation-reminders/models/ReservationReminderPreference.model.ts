import { z } from "zod";

const bookingReminderPreferenceSchema = z.object({
  bookingRemindersEnabled: z.boolean().optional(),
});

export const parseBookingReminderPreference = (value: unknown): boolean => {
  const result = bookingReminderPreferenceSchema.safeParse(value);
  return result.success ? (result.data.bookingRemindersEnabled ?? true) : true;
};
