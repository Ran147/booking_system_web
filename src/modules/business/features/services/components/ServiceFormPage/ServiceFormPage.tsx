import { AlertTriangle, ArrowLeft } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";
import { useServiceFormViewModel } from "@/modules/business/features/services";
import { ServiceForm } from "../ServiceForm";
import type { ServiceFormPageProps } from "./types";

export const ServiceFormPage = ({
  businessStatus,
  onCancel,
  onSuccess,
}: ServiceFormPageProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const navigate = useNavigate();

  const handleDefaultCancel = (): void => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  const handleDefaultSuccess = (serviceId: string): void => {
    if (onSuccess) {
      onSuccess(serviceId);
    } else {
      navigate(`/business/${ROUTE_PATH.BUSINESS.SERVICES}`);
    }
  };

  const viewModel = useServiceFormViewModel({
    businessStatus,
    onCancel: handleDefaultCancel,
    onSuccess: handleDefaultSuccess,
  });

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
          {t("services.form.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("services.form.subtitle")}
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
              {t("services.form.readOnlyNotice")}
            </p>
          </div>
        </div>
      )}

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            {t("services.form.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm onCancel={handleDefaultCancel} viewModel={viewModel} />
        </CardContent>
      </Card>
    </div>
  );
};
