import { AlertTriangle } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Badge, BADGE_VARIANT, PortalHomeTemplate } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useBusinessHomeViewModel } from "@/modules/business/features/home";
import type { BusinessHomePageProps } from "./BusinessHomePage.types";

export const BusinessHomePage = ({
  initialBusinessStatus,
  onNavigate,
}: BusinessHomePageProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const viewModel = useBusinessHomeViewModel({
    initialBusinessStatus,
    onNavigate,
  });

  const readOnlyAlert = viewModel.isReadOnly ? (
    <div
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">{t("errors.readOnly")}</p>
        <p className="text-xs opacity-90">
          {t("services.form.readOnlyNotice")}
        </p>
      </div>
    </div>
  ) : null;

  return (
    <PortalHomeTemplate
      badge={
        <Badge variant={BADGE_VARIANT.OUTLINE}>
          {viewModel.isSubscriber
            ? t("home.roleBadge")
            : t("home.roleCollaboratorBadge")}
        </Badge>
      }
      configurationItems={viewModel.configurationItems}
      configurationsSectionDescription={t("home.configsDescription")}
      configurationsSectionTitle={t("home.configsTitle")}
      description={t("home.subtitle")}
      greeting={t("home.welcome")}
      metrics={viewModel.metrics}
      quickAccessItems={viewModel.quickAccessItems}
      quickAccessSectionDescription={t("home.toolsDescription")}
      quickAccessSectionTitle={t("home.toolsTitle")}
      readOnlyAlert={readOnlyAlert}
      title={t("home.title")}
    />
  );
};
