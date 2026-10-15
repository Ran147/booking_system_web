import { useEffect } from "react";
import { useTheme } from "@/app/providers/theme/useTheme";
import { useSession } from "@/modules/auth";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";
import { useUserThemeQuery } from "../api/useUserThemeQuery";
import {
  clearPendingThemeSync,
  readPendingThemeSync,
} from "../utils/themePreferenceStorage";

export const useBusinessThemeSync = (): void => {
  const { setThemeMode } = useTheme();
  const session = useSession();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
  const themeQuery = useUserThemeQuery(userId);

  useEffect(() => {
    const profileTheme = themeQuery.data?.theme;
    const pendingThemeSync = readPendingThemeSync();
    const hasPendingPreferenceForUser = pendingThemeSync?.userId === userId;

    if (hasPendingPreferenceForUser) {
      if (profileTheme === pendingThemeSync.theme) {
        clearPendingThemeSync();
      }

      setThemeMode(pendingThemeSync.theme);
      return;
    }

    if (profileTheme) setThemeMode(profileTheme);
  }, [setThemeMode, themeQuery.data?.theme, userId]);
};
