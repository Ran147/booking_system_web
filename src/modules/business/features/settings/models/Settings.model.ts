import type { RadioGroupOption } from "@/components";
import type { ThemeMode } from "@/constants";
import type { Nullable } from "@/types";

/** Payload used to persist a theme for one authenticated account. */
export interface SaveUserThemeInput {
  readonly theme: ThemeMode;
  readonly userId: string;
}

/** Theme information read from a user profile. */
export interface UserThemePreference {
  readonly theme: Nullable<ThemeMode>;
}

/** Contract exposed by the KAN-52 settings page ViewModel. */
export interface SettingsPageViewModel {
  readonly handleThemeChange: (nextTheme: ThemeMode) => void;
  readonly isSaving: boolean;
  readonly showSaveError: boolean;
  readonly themeMode: ThemeMode;
  readonly themeOptions: readonly RadioGroupOption[];
}
