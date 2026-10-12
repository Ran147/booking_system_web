import { useTranslation } from "react-i18next";
import { useTheme } from "@/app/providers/theme/useTheme";
import { THEME_MODE, type ThemeMode } from "@/constants";
import { useSession } from "@/modules/auth";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";
import { useSaveUserThemeMutation } from "../api/useSaveUserThemeMutation";
import type { SettingsPageViewModel } from "../models";
import {
  clearPendingThemeSync,
  savePendingThemeSync,
} from "../utils/themePreferenceStorage";

export const useSettingsPageViewModel = (): SettingsPageViewModel => {
  const { t } = useTranslation();
  const { setThemeMode, themeMode } = useTheme();
  const session = useSession();
  const mutation = useSaveUserThemeMutation();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";

  const handleThemeChange = (nextTheme: ThemeMode): void => {
    const input = { theme: nextTheme, userId };
    setThemeMode(nextTheme);
    savePendingThemeSync(input);
    mutation.mutate(input, { onSuccess: clearPendingThemeSync });
  };

  return {
    handleThemeChange,
    isSaving: mutation.isPending,
    showSaveError: mutation.isError,
    themeMode,
    themeOptions: [
      { label: t("theme.lightLabel"), value: THEME_MODE.LIGHT },
      { label: t("theme.darkLabel"), value: THEME_MODE.DARK },
      { label: t("theme.systemLabel"), value: THEME_MODE.SYSTEM },
    ],
  };
};
