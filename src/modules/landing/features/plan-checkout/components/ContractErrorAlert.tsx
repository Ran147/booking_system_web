import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink } from "@/shared/components";
import { ARIA_ROLE, I18N_NAMESPACE, ROUTE_PATH } from "@/shared/constants";
import type { ContractError } from "../models/PlanDetailViewModel.interface";

export interface ContractErrorAlertProps {
  readonly contractError: ContractError;
}

// Why the checkout did not open (AC-KAN-21-10).
export const ContractErrorAlert = ({
  contractError,
}: ContractErrorAlertProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-destructive p-4 text-sm text-destructive"
      role={ARIA_ROLE.ALERT}
    >
      <p>{contractError.message}</p>
      {contractError.showCatalogLink ? (
        <AppLink to={ROUTE_PATH.LANDING.HOME}>
          {t("planCheckout.detail.catalogAction")}
        </AppLink>
      ) : null}
    </div>
  );
};
