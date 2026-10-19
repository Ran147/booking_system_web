import { z } from "zod";
import { IDLE_SESSION } from "../constants/IdleSession.constants";

// platformSettings/current: only the field this module reads. A missing,
// invalid or too short value makes the caller fall back to
// DEFAULT_PLATFORM_SETTINGS.
export const platformSettingsSchema = z.object({
  idleTimeoutMinutes: z.number().int().min(IDLE_SESSION.MIN_TIMEOUT_MINUTES),
});

export type PlatformSettings = z.infer<typeof platformSettingsSchema>;
