import { AlertTriangle, ArrowLeft } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button, BUTTON_VARIANT, Spinner } from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import { useServiceDiscountsViewModel } from "@/modules/business/features/services";
import { AddDiscountForm } from "./components/AddDiscountForm";
import { DiscountsTable } from "./components/DiscountsTable";
import type { ServiceDiscountsPageProps } from "./types/ServiceDiscountsPage.types";

export const ServiceDiscountsPage = ({
  businessInfo,
  initialService,
  onBack,
  onNavigate,
  serviceId,
  userPermissions,
  userRole,
}: ServiceDiscountsPageProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const navigate = useNavigate();
  const routeParameters = useParams<{ serviceId?: string }>();
  const effectiveServiceId = serviceId ?? routeParameters.serviceId;

  const viewModel = useServiceDiscountsViewModel({
    businessInfo,
    initialService,
    onNavigate,
    serviceId: effectiveServiceId,
    userPermissions,
    userRole,
  });

  const handleBack = (): void => {
    if (onBack) {
      onBack();
    } else {
      navigate(`/business/${ROUTE_PATH.BUSINESS.SERVICES}`);
    }
  };

  if (viewModel.isLoading) {
    return (
      <div className="container mx-auto flex h-64 max-w-4xl items-center justify-center px-4 py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          ariaLabel={t("services.form.backToServicesAction")}
          leftIcon={ArrowLeft}
          onClick={handleBack}
          size="sm"
          type="button"
          variant={BUTTON_VARIANT.GHOST}
        >
          {t("services.form.backToServicesAction")}
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-headline">
          {t("services.discounts.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {viewModel.service?.name
            ? `${viewModel.service.name} — ${t("services.discounts.subtitle")}`
            : t("services.discounts.subtitle")}
        </p>
      </div>

      {viewModel.isReadOnly && (
        <div
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">{t("errors.readOnly")}</p>
            <p className="text-xs opacity-90">
              {t("services.discounts.readOnlyNotice")}
            </p>
          </div>
        </div>
      )}

      <AddDiscountForm
        formError={viewModel.formError}
        formState={viewModel.formState}
        isPending={viewModel.isAddPending}
        isReadOnly={viewModel.isReadOnly}
        onFormChange={viewModel.handleFormChange}
        onSubmit={viewModel.handleAddDiscount}
      />

      {viewModel.discounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-muted-foreground">
          <p className="text-sm font-medium">
            {t("services.discounts.emptyTitle")}
          </p>
          <p className="text-xs mt-1">
            {t("services.discounts.emptyDescription")}
          </p>
        </div>
      ) : (
        <DiscountsTable
          currency={viewModel.currency}
          discounts={viewModel.discounts}
          isReadOnly={viewModel.isReadOnly}
          onRemoveDiscount={viewModel.handleRemoveDiscount}
          timeZone={viewModel.timeZone}
        />
      )}
    </div>
  );
};
