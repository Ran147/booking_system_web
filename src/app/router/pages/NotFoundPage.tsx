import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { APP_LINK_VARIANT, AppLink, PageTemplate } from "@/shared/components";
import { ROUTE_PATH } from "@/shared/constants";

export const NotFoundPage = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <main className="px-6 py-8">
      <PageTemplate
        actions={
          <AppLink
            to={ROUTE_PATH.LANDING.HOME}
            variant={APP_LINK_VARIANT.BUTTON}
          >
            {t("notFound.homeAction")}
          </AppLink>
        }
        description={t("notFound.description")}
        title={t("notFound.title")}
      />
    </main>
  );
};
