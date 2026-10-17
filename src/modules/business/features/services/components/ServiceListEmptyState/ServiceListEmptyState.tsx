import { Briefcase, Plus } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { ServiceListEmptyStateProps } from "./types/ServiceListEmptyState.types";

export const ServiceListEmptyState = ({
  isReadOnly,
  onCreateService,
}: ServiceListEmptyStateProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Briefcase className="h-7 w-7" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-base font-semibold text-foreground">
          {t("services.list.emptyTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("services.list.emptyDescription")}
        </p>
      </div>
      <Button
        ariaLabel={t("services.list.createServiceAction")}
        disabled={isReadOnly}
        leftIcon={Plus}
        onClick={onCreateService}
        size="md"
        type="button"
        variant="default"
      >
        {t("services.list.createServiceAction")}
      </Button>
    </div>
  );
};
