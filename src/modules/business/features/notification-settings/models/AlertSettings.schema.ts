import { z } from "zod";
import { BUSINESS_STATUS } from "@/domain";

export const DEFAULT_ALERT_SETTINGS = {
  bookingCancelledByCustomer: true,
  bookingCreated: true,
  subscriptionEnding: true,
} as const;

export const alertSettingsSchema = z.object({
  bookingCancelledByCustomer: z.boolean().default(true),
  bookingCreated: z.boolean().default(true),
  subscriptionEnding: z.boolean().default(true),
});

export const alertSettingsDocumentSchema = z.object({
  alertSettings: alertSettingsSchema.optional().default(DEFAULT_ALERT_SETTINGS),
  status: z.enum(BUSINESS_STATUS).default(BUSINESS_STATUS.ACTIVE),
});

export type AlertSettings = z.infer<typeof alertSettingsSchema>;
export type AlertSettingsDocument = z.infer<typeof alertSettingsDocumentSchema>;
export type AlertSettingKey = keyof AlertSettings;
