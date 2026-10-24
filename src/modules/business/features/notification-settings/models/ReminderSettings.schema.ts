import { z } from "zod";
import { BUSINESS_STATUS } from "@/domain";

const ONE_HOUR_MINUTES = 60;
const TWO_HOURS_MINUTES = 120;
const TWELVE_HOURS_MINUTES = 720;
const TWENTY_FOUR_HOURS_MINUTES = 1440;
const FORTY_EIGHT_HOURS_MINUTES = 2880;
export const MAX_REMINDER_LEAD_TIMES = 2;
export const REMINDER_LEAD_TIMES = [
  ONE_HOUR_MINUTES,
  TWO_HOURS_MINUTES,
  TWELVE_HOURS_MINUTES,
  TWENTY_FOUR_HOURS_MINUTES,
  FORTY_EIGHT_HOURS_MINUTES,
] as const;
export type ReminderLeadTime = (typeof REMINDER_LEAD_TIMES)[number];
export const DEFAULT_REMINDER_SETTINGS: {
  isEnabled: boolean;
  leadTimesMinutes: ReminderLeadTime[];
} = { isEnabled: true, leadTimesMinutes: [TWENTY_FOUR_HOURS_MINUTES] };

const leadTimeSchema = z.union([
  z.literal(ONE_HOUR_MINUTES),
  z.literal(TWO_HOURS_MINUTES),
  z.literal(TWELVE_HOURS_MINUTES),
  z.literal(TWENTY_FOUR_HOURS_MINUTES),
  z.literal(FORTY_EIGHT_HOURS_MINUTES),
]);

export const reminderSettingsSchema = z
  .object({
    isEnabled: z.boolean().default(true),
    leadTimesMinutes: z
      .array(leadTimeSchema)
      .max(MAX_REMINDER_LEAD_TIMES)
      .default([TWENTY_FOUR_HOURS_MINUTES]),
  })
  .superRefine((settings, context) => {
    if (
      new Set(settings.leadTimesMinutes).size !==
        settings.leadTimesMinutes.length ||
      (settings.isEnabled && settings.leadTimesMinutes.length === 0)
    )
      context.addIssue({ code: "custom", path: ["leadTimesMinutes"] });
  });

export const reminderSettingsDocumentSchema = z.object({
  reminderSettings: reminderSettingsSchema
    .optional()
    .default(DEFAULT_REMINDER_SETTINGS),
  status: z.enum(BUSINESS_STATUS).default(BUSINESS_STATUS.ACTIVE),
  timeZone: z.string().min(1),
});
export type ReminderSettings = z.infer<typeof reminderSettingsSchema>;
export type ReminderSettingsDocument = z.infer<
  typeof reminderSettingsDocumentSchema
>;
