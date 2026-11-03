import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { AboutMilestoneItem } from "../models/about.model";

interface AboutHistoryProps {
  milestones: AboutMilestoneItem[];
}

export const AboutHistory = ({
  milestones,
}: AboutHistoryProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <section aria-labelledby="about-history-heading" className="mt-16 sm:mt-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          id="about-history-heading"
        >
          {t("about.history.title")}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t("about.history.description")}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {milestones.map((milestone) => (
          <Card
            className="flex flex-col justify-between border-border bg-card shadow-xs transition-shadow hover:shadow-md"
            key={milestone.id}
          >
            <CardHeader className="pb-2">
              <span className="text-sm font-bold tracking-wider text-primary">
                {milestone.year}
              </span>
              <CardTitle className="text-lg font-semibold text-foreground">
                {milestone.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {milestone.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
