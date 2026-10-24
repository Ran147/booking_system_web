import { useTranslation } from "react-i18next";
import { toast } from "@/components/common";
import { I18N_NAMESPACE, STORAGE_KEY, type Language } from "@/constants";
import {
  clearPendingLanguageSyncIfMatches,
  resolveLanguage,
  savePendingLanguageSync,
  SESSION_STATUS,
  useSaveUserLanguageMutation,
  useSession,
  useUserLanguageQuery,
} from "@/modules/auth";
import type { LanguagePreferenceViewModel } from "../models";

export const useLanguagePreferenceViewModel =
  (): LanguagePreferenceViewModel => {
    const { i18n, t } = useTranslation([
      I18N_NAMESPACE.COMMON,
      I18N_NAMESPACE.CUSTOMER,
    ]);
    const session = useSession();
    const userId =
      session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
    const preferenceQuery = useUserLanguageQuery(userId);
    const updateMutation = useSaveUserLanguageMutation();

    const handleLanguageChange = async (language: Language): Promise<void> => {
      if (language === resolveLanguage(i18n.resolvedLanguage ?? i18n.language))
        return;

      await i18n.changeLanguage(language);
      localStorage.setItem(STORAGE_KEY.LANGUAGE, language);
      const pendingLanguageSync = {
        includeUpdatedAt: true,
        language,
        userId,
      } as const;
      savePendingLanguageSync(pendingLanguageSync);
      updateMutation.mutate(pendingLanguageSync, {
        onError: () => toast.error(t("customer:profile.preferences.syncError")),
        onSuccess: () => clearPendingLanguageSyncIfMatches(pendingLanguageSync),
      });
    };

    return {
      currentLanguage: resolveLanguage(i18n.resolvedLanguage ?? i18n.language),
      handleLanguageChange,
      isLoadingPreference: preferenceQuery.isPending,
      isSaving: updateMutation.isPending,
    };
  };
