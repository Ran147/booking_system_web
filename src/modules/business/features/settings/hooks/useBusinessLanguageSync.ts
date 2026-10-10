import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEY } from "@/constants";
import { useSession } from "@/modules/auth";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";
import { useUserLanguageQuery } from "../api/useUserLanguageQuery";
import { readPendingLanguageSync } from "../utils/languagePreferenceStorage";

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

    if (!profileLanguage || hasPendingPreferenceForUser) return;

    localStorage.setItem(STORAGE_KEY.LANGUAGE, profileLanguage);
    void i18n.changeLanguage(profileLanguage);
  }, [i18n, languageQuery.data?.language, userId]);
};
