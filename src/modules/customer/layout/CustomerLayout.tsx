import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { PortalShell, ViewStateSwitch } from "@/components";
import { ERROR_MESSAGE_KEY, I18N_NAMESPACE } from "@/constants";
import { CustomerFooter, CustomerNavbar } from "./components";
import { useCustomerLayoutViewModel } from "./hooks/useCustomerLayoutViewModel";

export const CustomerLayout = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { businessProfile, isBusinessUnavailable, retry, viewState } =
    useCustomerLayoutViewModel();

  return (
    <PortalShell
      footer={<CustomerFooter business={businessProfile} />}
      header={<CustomerNavbar business={businessProfile} />}
      title={t("layout.title")}
    >
      <ViewStateSwitch
        emptyMessage={t("layout.businessNotFound")}
        errorMessageKey={ERROR_MESSAGE_KEY.NETWORK}
        onRetry={retry}
        retryLabel={t("layout.retryAction")}
        viewState={viewState}
      >
        {isBusinessUnavailable ? (
          <p className="mb-6 rounded-lg border border-border bg-muted p-4 text-muted-foreground">
            {t("layout.business.unavailable")}
          </p>
        ) : null}
        <Outlet />
      </ViewStateSwitch>
    </PortalShell>
  );
};
