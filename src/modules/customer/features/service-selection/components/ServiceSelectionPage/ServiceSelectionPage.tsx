import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  EmptyState,
  ErrorState,
  PageTemplate,
  RadioGroup,
  Spinner,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useServiceSelectionViewModel } from "@/modules/customer/features/service-selection";
import { formatPrice } from "@/utils";

/**
 * Minimal first step of the booking flow: choose one active service
 * (AC-KAN-135-01, 04, 06, 08). The collaborator step (KAN-136 to 138) is not
 * part of it; availability then uses "any available".
 */
export const ServiceSelectionPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const viewModel = useServiceSelectionViewModel();

  return (
    <PageTemplate
      description={t("serviceSelection.subtitle")}
      title={t("serviceSelection.title")}
    >
      {viewModel.isLoading ? <Spinner /> : null}
      {viewModel.validationKey ? (
        <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>
          {t(viewModel.validationKey)}
        </Alert>
      ) : null}
      {viewModel.loadErrorKey ? (
        <div className="flex flex-col items-start gap-3">
          <ErrorState messageKey={viewModel.loadErrorKey} />
          <Button onClick={viewModel.handleRetry} variant="outline">
            {t("availability.retryAction")}
          </Button>
        </div>
      ) : null}
      {viewModel.isEmpty ? (
        <EmptyState message={t("serviceSelection.list.empty")} />
      ) : null}
      {viewModel.services.length > 0 ? (
        <div className="flex flex-col gap-6">
          <RadioGroup
            label={t("serviceSelection.groupLabel")}
            onValueChange={viewModel.handleSelectService}
            options={viewModel.services.map((service) => ({
              description: t("serviceSelection.serviceDetail", {
                minutes: service.durationMinutes,
                price: formatPrice(
                  service.priceInCents,
                  viewModel.currency,
                  viewModel.language,
                ),
              }),
              label: service.name,
              value: service.id,
            }))}
            value={viewModel.selectedServiceId}
          />
          <div className="flex justify-end">
            <Button onClick={viewModel.handleContinue}>
              {t("serviceSelection.continueAction")}
            </Button>
          </div>
        </div>
      ) : null}
    </PageTemplate>
  );
};
