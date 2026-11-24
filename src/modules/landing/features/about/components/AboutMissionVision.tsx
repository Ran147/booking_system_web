import { Compass, Target } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { ABOUT_MISSION_VISION } from "../constants/about.constants";
import type { AboutMissionVisionItem } from "../models/about.model";

interface AboutMissionVisionProps {
  mission: AboutMissionVisionItem;
  vision: AboutMissionVisionItem;
}

export const AboutMissionVision = ({
  mission,
  vision,
}: AboutMissionVisionProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <section
      aria-label={t("about.mission.sectionAriaLabel")}
      className="mt-16 sm:mt-20"
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card
          className="flex flex-col border-border bg-card p-2 shadow-xs transition-shadow hover:shadow-md"
          key={mission.id}
        >
          <CardHeader className="space-y-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target aria-hidden="true" className="h-6 w-6" />
            </span>
            <CardTitle
              className="text-2xl font-bold tracking-tight text-foreground"
              id={`about-${ABOUT_MISSION_VISION.MISSION}-heading`}
            >
              {mission.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-muted-foreground">
              {mission.description}
            </p>
          </CardContent>
        </Card>

        <Card
          className="flex flex-col border-border bg-card p-2 shadow-xs transition-shadow hover:shadow-md"
          key={vision.id}
        >
          <CardHeader className="space-y-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Compass aria-hidden="true" className="h-6 w-6" />
            </span>
            <CardTitle
              className="text-2xl font-bold tracking-tight text-foreground"
              id={`about-${ABOUT_MISSION_VISION.VISION}-heading`}
            >
              {vision.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-muted-foreground">
              {vision.description}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
