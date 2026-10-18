import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { PortalShell, ViewStateSwitch } from "@/components";
import { I18N_NAMESPACE } from "@/constants";
import { CustomerFooter } from "./components";
import { useCustomerLayoutViewModel } from "./hooks/useCustomerLayoutViewModel";

export const CustomerLayout = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { businessProfile, viewState } = useCustomerLayoutViewModel();

  return (
    <PortalShell
      footer={<CustomerFooter business={businessProfile} />}
      title={t("layout.title")}
    >
      <ViewStateSwitch
        emptyMessage={t("layout.businessNotFound")}
        viewState={viewState}
      >
        <Outlet />
      </ViewStateSwitch>
    </PortalShell>
  );
};
