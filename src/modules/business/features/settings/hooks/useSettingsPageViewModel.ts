import { useTranslation } from "react-i18next";
import { useTheme } from "@/app/providers/theme/useTheme";
import {
  I18N_NAMESPACE,
  LANGUAGE,
  STORAGE_KEY,
  STRING,
  THEME_MODE,
  type Language,
} from "@/constants";
import { USER_ROLE } from "@/domain";
import { useSession } from "@/modules/auth";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";
import { useSaveUserLanguageMutation } from "../api/useSaveUserLanguageMutation";
import { useSaveUserThemeMutation } from "../api/useSaveUserThemeMutation";
import type { SettingsPageViewModel } from "../models";
import { isThemeMode } from "../utils/isThemeMode";
import {
  clearPendingLanguageSync,
  savePendingLanguageSync,
} from "../utils/languagePreferenceStorage";
import {
  clearPendingThemeSync,
  savePendingThemeSync,
} from "../utils/themePreferenceStorage";

const resolveLanguage = (language: string): Language =>
  language.startsWith(LANGUAGE.EN) ? LANGUAGE.EN : LANGUAGE.ES;

export const useSettingsPageViewModel = (): SettingsPageViewModel => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.COMMON);
  const { setThemeMode, themeMode } = useTheme();
  const session = useSession();
  const languageMutation = useSaveUserLanguageMutation();
  const themeMutation = useSaveUserThemeMutation();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : STRING.EMPTY;

  const handleLanguageChange = (language: Language): void => {
    localStorage.setItem(STORAGE_KEY.LANGUAGE, language);
    savePendingLanguageSync({ language, userId });
    void i18n.changeLanguage(language);
    languageMutation.mutate(
      { language, userId },
      { onSuccess: clearPendingLanguageSync },
    );
  };

  const handleThemeChange = (nextTheme: string): void => {
    if (!isThemeMode(nextTheme)) return;

    const input = { theme: nextTheme, userId };
    setThemeMode(nextTheme);
    savePendingThemeSync(input);
    themeMutation.mutate(input, { onSuccess: clearPendingThemeSync });
  };

  return {
    currentLanguage: resolveLanguage(i18n.resolvedLanguage ?? i18n.language),
    handleLanguageChange,
    handleThemeChange,
    isLanguageSaving: languageMutation.isPending,
    isSubscriber:
      session.status === SESSION_STATUS.SIGNED_IN &&
      session.role === USER_ROLE.SUBSCRIBER,
    isThemeSaving: themeMutation.isPending,
    languageOptions: [
      { label: t("language.spanishLabel"), value: LANGUAGE.ES },
      { label: t("language.englishLabel"), value: LANGUAGE.EN },
    ],
    showLanguageSaveError: languageMutation.isError,
    showThemeSaveError: themeMutation.isError,
    themeMode,
    themeOptions: [
      { label: t("theme.lightLabel"), value: THEME_MODE.LIGHT },
      { label: t("theme.darkLabel"), value: THEME_MODE.DARK },
      { label: t("theme.systemLabel"), value: THEME_MODE.SYSTEM },
    ],
  };
};
