import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { PortalShell } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";

export const BusinessLayout = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <PortalShell title={t("layout.title")}>
      <Outlet />
    </PortalShell>
  );
};
