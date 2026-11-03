import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";

export const AboutHero = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <header className="mx-auto max-w-4xl text-center">
      <Badge className="mb-4" variant="secondary">
        {t("about.hero.badge")}
      </Badge>
      <h1
        className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        id="about-hero-title"
      >
        {t("about.hero.title")}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
        {t("about.hero.description")}
      </p>
    </header>
  );
};
