import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { AboutStatItem } from "../models/about.model";

interface AboutStatsProps {
  stats: AboutStatItem[];
}

export const AboutStats = ({ stats }: AboutStatsProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <section aria-labelledby="about-stats-heading" className="mt-16 sm:mt-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          id="about-stats-heading"
        >
          {t("about.stats.title")}
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {stats.map((stat) => (
          <Card
            className="border-border bg-card p-6 text-center shadow-xs"
            key={stat.id}
          >
            <CardContent className="p-0">
              <span className="block text-3xl font-extrabold text-primary sm:text-4xl">
                {stat.value}
              </span>
              <span className="mt-2 block text-xs font-medium text-muted-foreground sm:text-sm">
                {stat.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
