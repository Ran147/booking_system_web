import { z } from "zod";

// platformSettings/current: only the field this module reads. A missing or
// invalid value makes the caller fall back to DEFAULT_PLATFORM_SETTINGS.
export const platformSettingsSchema = z.object({
  idleTimeoutMinutes: z.number().int().positive(),
});

export type PlatformSettings = z.infer<typeof platformSettingsSchema>;
