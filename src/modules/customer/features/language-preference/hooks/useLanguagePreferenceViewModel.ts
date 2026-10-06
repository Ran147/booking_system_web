import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/common";
import {
  DEFAULT_LANGUAGE,
  I18N_NAMESPACE,
  LANGUAGE,
  STORAGE_KEY,
  type Language,
} from "@/constants";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import {
  useLanguagePreferenceQuery,
  useUpdateLanguagePreferenceMutation,
} from "../api";
import type { LanguagePreferenceViewModel } from "../models";

const resolveLanguage = (language: string): Language =>
  language.startsWith(LANGUAGE.EN) ? LANGUAGE.EN : DEFAULT_LANGUAGE;

export const useLanguagePreferenceViewModel =
  (): LanguagePreferenceViewModel => {
    const { i18n, t } = useTranslation([
      I18N_NAMESPACE.COMMON,
      I18N_NAMESPACE.CUSTOMER,
    ]);
    const session = useSession();
    const userId =
      session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
    const preferenceQuery = useLanguagePreferenceQuery(userId);
    const updateMutation = useUpdateLanguagePreferenceMutation();

    useEffect(() => {
      if (preferenceQuery.data) {
        void i18n.changeLanguage(preferenceQuery.data);
        localStorage.setItem(STORAGE_KEY.LANGUAGE, preferenceQuery.data);
      }
    }, [i18n, preferenceQuery.data]);

    const handleLanguageChange = async (language: Language): Promise<void> => {
      if (language === resolveLanguage(i18n.resolvedLanguage ?? i18n.language))
        return;

      await i18n.changeLanguage(language);
      localStorage.setItem(STORAGE_KEY.LANGUAGE, language);
      updateMutation.mutate(
        { language, userId },
        {
          onError: () =>
            toast.error(t("customer:profile.preferences.syncError")),
        },
      );
    };

    return {
      currentLanguage: resolveLanguage(i18n.resolvedLanguage ?? i18n.language),
      handleLanguageChange,
      isLoadingPreference: preferenceQuery.isPending,
      isSaving: updateMutation.isPending,
    };
  };
