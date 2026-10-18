import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEY } from "@/constants";
import { useSession } from "@/modules/auth";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";
import type { Nullable } from "@/types";
import { useSaveUserLanguageMutation } from "../api/useSaveUserLanguageMutation";
import { useUserLanguageQuery } from "../api/useUserLanguageQuery";
import type { SaveUserLanguageInput } from "../models";
import {
  clearPendingLanguageSync,
  clearPendingLanguageSyncIfMatches,
  readPendingLanguageSync,
} from "../utils/languagePreferenceStorage";

export const useBusinessLanguageSync = (): void => {
  const { i18n } = useTranslation();
  const session = useSession();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
  const { mutate: saveUserLanguage } = useSaveUserLanguageMutation();
  const languageQuery = useUserLanguageQuery(userId);
  const attemptedPendingSync = useRef<Nullable<SaveUserLanguageInput>>(null);

  useEffect(() => {
    const profileLanguage = languageQuery.data?.language;
    const pendingLanguageSync = readPendingLanguageSync();
    const hasPendingPreferenceForUser = pendingLanguageSync?.userId === userId;

    if (hasPendingPreferenceForUser) {
      if (profileLanguage === pendingLanguageSync.language) {
        clearPendingLanguageSync();
        attemptedPendingSync.current = null;
      } else if (
        languageQuery.isSuccess &&
        (attemptedPendingSync.current?.language !==
          pendingLanguageSync.language ||
          attemptedPendingSync.current.userId !== pendingLanguageSync.userId)
      ) {
        attemptedPendingSync.current = pendingLanguageSync;
        saveUserLanguage(pendingLanguageSync, {
          onSuccess: () => {
            clearPendingLanguageSyncIfMatches(pendingLanguageSync);
          },
        });
      }

      localStorage.setItem(STORAGE_KEY.LANGUAGE, pendingLanguageSync.language);
      void i18n.changeLanguage(pendingLanguageSync.language);
      return;
    }

    if (attemptedPendingSync.current?.userId === userId) {
      if (profileLanguage === attemptedPendingSync.current.language) {
        attemptedPendingSync.current = null;
      } else {
        return;
      }
    }

    if (profileLanguage) {
      localStorage.setItem(STORAGE_KEY.LANGUAGE, profileLanguage);
      void i18n.changeLanguage(profileLanguage);
    }
  }, [
    i18n,
    languageQuery.data?.language,
    languageQuery.isSuccess,
    saveUserLanguage,
    userId,
  ]);
};
