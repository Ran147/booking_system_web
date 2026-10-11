import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { PortalShell } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { CustomerFooter } from "./components";

export const CustomerLayout = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);

  return (
    <PortalShell footer={<CustomerFooter />} title={t("layout.title")}>
      <Outlet />
    </PortalShell>
  );
};
