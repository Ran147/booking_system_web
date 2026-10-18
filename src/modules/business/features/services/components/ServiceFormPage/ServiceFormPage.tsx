import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  RotateCw,
  Tag,
  Users,
} from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from "@/components/common";
import { ERROR_MESSAGE_KEY, I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import { useServiceFormViewModel } from "@/modules/business/features/services";
import { ServiceForm } from "../ServiceForm";
import type { ServiceFormPageProps } from "./types";

export const ServiceFormPage = ({
  businessStatus,
  initialService,
  onCancel,
  onSuccess,
  serviceId,
}: ServiceFormPageProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const navigate = useNavigate();
  const routeParameters = useParams<{ serviceId?: string }>();

  const effectiveServiceId = serviceId ?? routeParameters.serviceId;

  const handleDefaultCancel = (): void => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  const handleDefaultSuccess = (savedServiceId: string): void => {
    if (onSuccess) {
      onSuccess(savedServiceId);
    } else {
      navigate(`/business/${ROUTE_PATH.BUSINESS.SERVICES}`);
    }
  };

  const viewModel = useServiceFormViewModel({
    businessStatus,
    initialService,
    onCancel: handleDefaultCancel,
    onSuccess: handleDefaultSuccess,
    serviceId: effectiveServiceId,
  });

  const pageTitle = viewModel.isEditMode
    ? t("services.form.editTitle")
    : t("services.form.title");

  const pageSubtitle = viewModel.isEditMode
    ? t("services.form.editSubtitle")
    : t("services.form.subtitle");

  if (viewModel.isLoading) {
    return (
      <div className="container mx-auto flex h-64 max-w-3xl items-center justify-center px-4 py-8">
        <Spinner />
      </div>
    );
  }

  if (viewModel.isLoadError) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            ariaLabel={t("services.form.backToServicesAction")}
            leftIcon={ArrowLeft}
            onClick={handleDefaultCancel}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("services.form.backToServicesAction")}
          </Button>
        </div>

        <div
          aria-live="assertive"
          className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-10 text-center text-destructive"
          role="alert"
        >
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-medium">
            {t(viewModel.loadErrorMessageKey ?? ERROR_MESSAGE_KEY.NETWORK, {
              ns: I18N_NAMESPACE.COMMON,
            })}
          </p>
          <div className="flex items-center gap-3">
            <Button
              ariaLabel={t("services.list.retryAction")}
              leftIcon={RotateCw}
              onClick={viewModel.handleRetryLoad}
              size="sm"
              type="button"
              variant="outline"
            >
              {t("services.list.retryAction")}
            </Button>
            <Button
              ariaLabel={t("services.form.backToServicesAction")}
              onClick={handleDefaultCancel}
              size="sm"
              type="button"
              variant="ghost"
            >
              {t("services.form.backToServicesAction")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          ariaLabel={t("services.form.backToServicesAction")}
          leftIcon={ArrowLeft}
          onClick={handleDefaultCancel}
          size="sm"
          type="button"
          variant="ghost"
        >
          {t("services.form.backToServicesAction")}
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-headline">
          {pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{pageSubtitle}</p>
      </div>

      {viewModel.isEditMode && effectiveServiceId && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            leftIcon={Tag}
            onClick={() =>
              navigate(`/business/services/${effectiveServiceId}/discounts`)
            }
            size="sm"
            type="button"
            variant="outline"
          >
            {t("services.discounts.title")}
          </Button>
          <Button
            leftIcon={Users}
            onClick={() =>
              navigate(`/business/services/${effectiveServiceId}/collaborators`)
            }
            size="sm"
            type="button"
            variant="outline"
          >
            {t("services.collaborators.title")}
          </Button>
        </div>
      )}

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
              {t("services.form.readOnlyNotice")}
            </p>
          </div>
        </div>
      )}

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            {pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm onCancel={handleDefaultCancel} viewModel={viewModel} />
        </CardContent>
      </Card>
    </div>
  );
};
