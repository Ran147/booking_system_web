import { lazy, Suspense, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageTemplate } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { HeroSection } from "../features/home/components/HeroSection";

const PlanCatalogSection = lazy(async () => {
  const { PlanCatalogSection: Component } = await import("../features/home");
  return { default: Component };
});

// Temporary portal home. Replace it with the first feature route of this
// portal and delete the placeholder folder.
export const LandingPlaceholderPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <PageTemplate
      description={t("placeholder.description")}
      title={t("placeholder.title")}
    >
      <HeroSection />
      <Suspense fallback={null}>
        <PlanCatalogSection />
      </Suspense>
    </PageTemplate>
  );
};
