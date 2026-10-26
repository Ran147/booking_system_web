import { BarChart3, BellRing, CalendarCheck2, Users } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { ABOUT_ICON_TYPE } from "../constants/about.constants";
import type { AboutOfferingItem } from "../models/about.model";

interface AboutOfferingsProps {
  offerings: AboutOfferingItem[];
}

const renderOfferingIcon = (iconName: string): ReactElement => {
  switch (iconName) {
    case ABOUT_ICON_TYPE.ANALYTICS:
      return <BarChart3 aria-hidden="true" className="h-6 w-6 text-primary" />;
    case ABOUT_ICON_TYPE.BOOKING:
      return (
        <CalendarCheck2 aria-hidden="true" className="h-6 w-6 text-primary" />
      );
    case ABOUT_ICON_TYPE.COLLABORATION:
      return <Users aria-hidden="true" className="h-6 w-6 text-primary" />;
    case ABOUT_ICON_TYPE.REMINDERS:
    default:
      return <BellRing aria-hidden="true" className="h-6 w-6 text-primary" />;
  }
};

export const AboutOfferings = ({
  offerings,
}: AboutOfferingsProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <section
      aria-labelledby="about-offerings-heading"
      className="mt-16 sm:mt-24"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          id="about-offerings-heading"
        >
          {t("about.offerings.title")}
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("about.offerings.subtitle")}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {offerings.map((offering) => (
          <Card
            className="flex flex-col border-border bg-card shadow-xs transition-colors hover:border-primary/50"
            key={offering.id}
          >
            <CardHeader className="space-y-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                {renderOfferingIcon(offering.icon)}
              </span>
              <CardTitle className="text-lg font-semibold text-foreground">
                {offering.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {offering.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
