import { useEffect, useRef } from "react";
import { useTheme } from "@/app/providers/theme/useTheme";
import type { ThemeMode } from "@/constants";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import { useThemePreferenceQuery } from "../api/useThemePreferenceQuery";
import { useUpdateThemePreferenceMutation } from "../api/useUpdateThemePreferenceMutation";
import type { ThemePreferenceViewModel } from "../models/ThemePreferenceViewModel.interface";

export const useThemePreferenceViewModel = (): ThemePreferenceViewModel => {
  const session = useSession();
  const { setThemeMode, themeMode } = useTheme();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
  const preferenceQuery = useThemePreferenceQuery(userId);
  const preferenceMutation = useUpdateThemePreferenceMutation();
  const hasAppliedRemotePreference = useRef(false);

  useEffect(() => {
    if (
      !hasAppliedRemotePreference.current &&
      preferenceQuery.isSuccess &&
      preferenceQuery.data
    ) {
      hasAppliedRemotePreference.current = true;
      setThemeMode(preferenceQuery.data);
    }
  }, [preferenceQuery.data, preferenceQuery.isSuccess, setThemeMode]);

  const handleThemeChange = (nextThemeMode: ThemeMode): void => {
    if (
      !userId ||
      nextThemeMode === themeMode ||
      preferenceMutation.isPending
    ) {
      return;
    }

    setThemeMode(nextThemeMode);
    preferenceMutation.mutate({
      themeMode: nextThemeMode,
      userId,
    });
  };

  return {
    handleThemeChange,
    isLoading: preferenceQuery.isPending,
    isSyncError: preferenceQuery.isError || preferenceMutation.isError,
    isSyncing: preferenceMutation.isPending,
    themeMode,
  };
};
