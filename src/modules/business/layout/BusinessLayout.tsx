import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { PortalShell } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { useBusinessLanguageSync } from "../features/settings/hooks/useBusinessLanguageSync";

export const BusinessLayout = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  useBusinessLanguageSync();

  return (
    <PortalShell title={t("layout.title")}>
      <Outlet />
    </PortalShell>
  );
};
