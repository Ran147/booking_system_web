import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AppLink } from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
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
    <Alert className="flex flex-col gap-2">
      <p>{contractError.message}</p>
      {contractError.showCatalogLink ? (
        <AppLink to={ROUTE_PATH.LANDING.HOME}>
          {t("planCheckout.detail.catalogAction")}
        </AppLink>
      ) : null}
    </Alert>
  );
};
