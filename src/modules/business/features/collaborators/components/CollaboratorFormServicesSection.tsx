import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ALERT_VARIANT, CheckboxField } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { ActiveServiceOption } from "../models";

interface CollaboratorFormServicesSectionProps {
  readonly activeServices: readonly ActiveServiceOption[];
  readonly errorMessageKey?: string;
  readonly hasUpcomingBookingsError: boolean;
  readonly isReadOnly: boolean;
  readonly isSubmitting: boolean;
  readonly onToggleService: (serviceId: string) => void;
  readonly removedServicesBookingsCount: number;
  readonly selectedServiceIds: readonly string[];
}

export const CollaboratorFormServicesSection = ({
  activeServices,
  errorMessageKey,
  hasUpcomingBookingsError,
  isReadOnly,
  isSubmitting,
  onToggleService,
  removedServicesBookingsCount,
  selectedServiceIds,
}: CollaboratorFormServicesSectionProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.VALIDATION,
  ]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-medium text-foreground">
          {t("business:collaborators.form.servicesSectionTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("business:collaborators.form.servicesRequiredHint")}
        </p>
      </div>
      {hasUpcomingBookingsError && (
        <Alert variant={ALERT_VARIANT.WARNING}>
          {t("business:collaborators.edit.bookingsLoadWarning")}
        </Alert>
      )}
      {!hasUpcomingBookingsError && removedServicesBookingsCount > 0 && (
        <Alert variant={ALERT_VARIANT.WARNING}>
          {t("business:collaborators.edit.serviceHasBookingsWarning", {
            count: removedServicesBookingsCount,
          })}
        </Alert>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {activeServices.map((service) => (
          <CheckboxField
            checked={selectedServiceIds.includes(service.id)}
            disabled={isReadOnly || isSubmitting}
            key={service.id}
            label={service.name}
            name={`service-${service.id}`}
            onChange={(): void => {
              onToggleService(service.id);
            }}
          />
        ))}
      </div>
      {errorMessageKey && (
        <p className="text-sm text-destructive">
          {t(errorMessageKey as never)}
        </p>
      )}
    </div>
  );
};
