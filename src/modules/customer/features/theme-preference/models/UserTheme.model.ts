import { z } from "zod";
import { THEME_MODE, type ThemeMode } from "@/constants";
import type { Nullable } from "@/types";

const userThemeSchema = z.object({
  theme: z.enum([THEME_MODE.DARK, THEME_MODE.LIGHT, THEME_MODE.SYSTEM]),
});

export const parseUserTheme = (value: unknown): Nullable<ThemeMode> => {
  const result = userThemeSchema.safeParse(value);
  return result.success ? result.data.theme : null;
};
