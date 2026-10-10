import { useTranslation } from "react-i18next";
import {
  I18N_NAMESPACE,
  LANGUAGE,
  STORAGE_KEY,
  type Language,
} from "@/constants";
import { useSession } from "@/modules/auth";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";
import { useSaveUserLanguageMutation } from "../api/useSaveUserLanguageMutation";
import type { SettingsPageViewModel } from "../models";
import {
  clearPendingLanguageSync,
  savePendingLanguageSync,
} from "../utils/languagePreferenceStorage";

const resolveLanguage = (language: string): Language =>
  language.startsWith(LANGUAGE.EN) ? LANGUAGE.EN : LANGUAGE.ES;

export const useSettingsPageViewModel = (): SettingsPageViewModel => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.COMMON);
  const session = useSession();
  const mutation = useSaveUserLanguageMutation();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";

  const handleLanguageChange = (language: Language): void => {
    localStorage.setItem(STORAGE_KEY.LANGUAGE, language);
    savePendingLanguageSync({ language, userId });
    void i18n.changeLanguage(language);
    mutation.mutate(
      { language, userId },
      { onSuccess: clearPendingLanguageSync },
    );
  };

  return {
    currentLanguage: resolveLanguage(i18n.resolvedLanguage ?? i18n.language),
    handleLanguageChange,
    isSaving: mutation.isPending,
    languageOptions: [
      { label: t("language.spanishLabel"), value: LANGUAGE.ES },
      { label: t("language.englishLabel"), value: LANGUAGE.EN },
    ],
    showSaveError: mutation.isError,
  };
};
