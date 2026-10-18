import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import { HERO_SECTION_CONSTANTS } from "../constants/HeroSection.constants";
import type { HeroSectionViewModel } from "../models/HeroSectionViewModel.interface";

export const useHeroSectionViewModel = (): HeroSectionViewModel => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  const handleCtaClick = (): void => {
    const targetSection = document.getElementById(
      HERO_SECTION_CONSTANTS.TARGET_SECTION_ID,
    );
    const targetHeading = document.getElementById(
      HERO_SECTION_CONSTANTS.TARGET_HEADING_ID,
    );

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: HERO_SECTION_CONSTANTS.SCROLL_BEHAVIOR,
      });

      if (targetHeading) {
        if (!targetHeading.hasAttribute("tabindex")) {
          targetHeading.setAttribute("tabindex", "-1");
        }
        targetHeading.focus({ preventScroll: true });
      }
    } else {
      window.location.hash = `#${HERO_SECTION_CONSTANTS.TARGET_SECTION_ID}`;
    }
  };

  return {
    badgeLabel: t("home.hero.badge"),
    ctaLabel: t("home.hero.ctaAction"),
    handleCtaClick,
    tagline: t("home.hero.tagline"),
    title: t("home.hero.title"),
  };
};
