import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEY } from "@/constants";
import { useSession } from "@/modules/auth";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";
import { useUserLanguageQuery } from "../api/useUserLanguageQuery";
import {
  clearPendingLanguageSync,
  readPendingLanguageSync,
} from "../utils/languagePreferenceStorage";

export const useBusinessLanguageSync = (): void => {
  const { i18n } = useTranslation();
  const session = useSession();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
  const languageQuery = useUserLanguageQuery(userId);

  useEffect(() => {
    const profileLanguage = languageQuery.data?.language;
    const pendingLanguageSync = readPendingLanguageSync();
    const hasPendingPreferenceForUser = pendingLanguageSync?.userId === userId;

    if (!profileLanguage) return;

    const languageToApply = hasPendingPreferenceForUser
      ? pendingLanguageSync.language
      : profileLanguage;

    if (
      hasPendingPreferenceForUser &&
      pendingLanguageSync.language === profileLanguage
    ) {
      clearPendingLanguageSync();
    }

    localStorage.setItem(STORAGE_KEY.LANGUAGE, languageToApply);
    void i18n.changeLanguage(languageToApply);
  }, [i18n, languageQuery.data?.language, userId]);
};
