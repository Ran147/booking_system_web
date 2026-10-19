import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { AboutHero } from "./components/AboutHero";
import { AboutHistory } from "./components/AboutHistory";
import { AboutOfferings } from "./components/AboutOfferings";
import { AboutStats } from "./components/AboutStats";
import { useAboutViewModel } from "./hooks/useAboutViewModel";

export const AboutPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const { milestones, offerings, stats } = useAboutViewModel();

  return (
    <main
      aria-label={t("about.page.ariaLabel")}
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <AboutHero />
      <AboutOfferings offerings={offerings} />
      <AboutHistory milestones={milestones} />
      <AboutStats stats={stats} />
    </main>
  );
};
