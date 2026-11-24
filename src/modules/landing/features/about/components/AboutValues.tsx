import { HeartHandshake, Lightbulb, Scale, ShieldCheck } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { ABOUT_ICON_TYPE } from "../constants/about.constants";
import type { AboutValueItem } from "../models/about.model";

interface AboutValuesProps {
  values: AboutValueItem[];
}

const renderValueIcon = (iconName: string): ReactElement => {
  switch (iconName) {
    case ABOUT_ICON_TYPE.INNOVATION:
      return <Lightbulb aria-hidden="true" className="h-6 w-6 text-primary" />;
    case ABOUT_ICON_TYPE.RELIABILITY:
      return (
        <ShieldCheck aria-hidden="true" className="h-6 w-6 text-primary" />
      );
    case ABOUT_ICON_TYPE.TRANSPARENCY:
      return <Scale aria-hidden="true" className="h-6 w-6 text-primary" />;
    case ABOUT_ICON_TYPE.USER_FOCUS:
    default:
      return (
        <HeartHandshake aria-hidden="true" className="h-6 w-6 text-primary" />
      );
  }
};

export const AboutValues = ({ values }: AboutValuesProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <section aria-labelledby="about-values-heading" className="mt-16 sm:mt-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          id="about-values-heading"
        >
          {t("about.values.title")}
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {t("about.values.subtitle")}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((valueItem) => (
          <Card
            className="flex flex-col border-border bg-card shadow-xs transition-shadow hover:shadow-md"
            key={valueItem.id}
          >
            <CardHeader className="space-y-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                {renderValueIcon(valueItem.icon)}
              </span>
              <CardTitle className="text-lg font-semibold text-foreground">
                {valueItem.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {valueItem.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
