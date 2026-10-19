import { useEffect, useRef } from "react";
import { useTheme } from "@/app/providers/theme/useTheme";
import { useSession } from "@/modules/auth";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";
import type { Nullable } from "@/types";
import { useSaveUserThemeMutation } from "../api/useSaveUserThemeMutation";
import { useUserThemeQuery } from "../api/useUserThemeQuery";
import type { SaveUserThemeInput } from "../models";
import {
  clearPendingThemeSync,
  clearPendingThemeSyncIfMatches,
  readPendingThemeSync,
} from "../utils/themePreferenceStorage";

export const useBusinessThemeSync = (): void => {
  const { setThemeMode } = useTheme();
  const session = useSession();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
  const { mutate: saveUserTheme } = useSaveUserThemeMutation();
  const themeQuery = useUserThemeQuery(userId);
  const attemptedPendingSync = useRef<Nullable<SaveUserThemeInput>>(null);

  useEffect(() => {
    const profileTheme = themeQuery.data?.theme;
    const pendingThemeSync = readPendingThemeSync();
    const hasPendingPreferenceForUser = pendingThemeSync?.userId === userId;

    if (hasPendingPreferenceForUser) {
      if (profileTheme === pendingThemeSync.theme) {
        clearPendingThemeSync();
        attemptedPendingSync.current = null;
      } else if (
        themeQuery.isSuccess &&
        (attemptedPendingSync.current?.theme !== pendingThemeSync.theme ||
          attemptedPendingSync.current.userId !== pendingThemeSync.userId)
      ) {
        attemptedPendingSync.current = pendingThemeSync;
        saveUserTheme(pendingThemeSync, {
          onSuccess: () => {
            clearPendingThemeSyncIfMatches(pendingThemeSync);
          },
        });
      }

      setThemeMode(pendingThemeSync.theme);
      return;
    }

    if (attemptedPendingSync.current?.userId === userId) {
      if (profileTheme === attemptedPendingSync.current.theme) {
        attemptedPendingSync.current = null;
      } else {
        return;
      }
    }

    if (profileTheme) setThemeMode(profileTheme);
  }, [
    saveUserTheme,
    setThemeMode,
    themeQuery.data?.theme,
    themeQuery.isSuccess,
    userId,
  ]);
};
