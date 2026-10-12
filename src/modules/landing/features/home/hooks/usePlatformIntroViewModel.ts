import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import { PLATFORM_INTRO_CONSTANTS } from "../constants/PlatformIntro.constants";
import type { PlatformIntroViewModel } from "../models/PlatformIntroViewModel.interface";

export const usePlatformIntroViewModel = (): PlatformIntroViewModel => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const badge = t(PLATFORM_INTRO_CONSTANTS.BADGE_KEY);
  const title = t(PLATFORM_INTRO_CONSTANTS.TITLE_KEY);
  const summary = t(PLATFORM_INTRO_CONSTANTS.SUMMARY_KEY);
  const fullText = t(PLATFORM_INTRO_CONSTANTS.FULL_TEXT_KEY);

  const hasFullText =
    Boolean(fullText) && fullText !== PLATFORM_INTRO_CONSTANTS.FULL_TEXT_KEY;

  const handleToggle = useCallback((): void => {
    setIsExpanded((previousState) => !previousState);
  }, []);

  const toggleButtonLabel = isExpanded
    ? t(PLATFORM_INTRO_CONSTANTS.READ_LESS_KEY)
    : t(PLATFORM_INTRO_CONSTANTS.READ_MORE_KEY);

  const features = [
    {
      description: t(PLATFORM_INTRO_CONSTANTS.FEATURES_SCHEDULING_KEY),
      key: "scheduling",
    },
    {
      description: t(PLATFORM_INTRO_CONSTANTS.FEATURES_NOTIFICATIONS_KEY),
      key: "notifications",
    },
    {
      description: t(PLATFORM_INTRO_CONSTANTS.FEATURES_PAYMENTS_KEY),
      key: "payments",
    },
  ];

  return {
    badge,
    features,
    fullText,
    handleToggle,
    hasFullText,
    isExpanded,
    summary,
    title,
    toggleButtonLabel,
  };
};
