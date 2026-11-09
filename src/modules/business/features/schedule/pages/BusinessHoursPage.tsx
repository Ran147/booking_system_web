import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageTemplate } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BusinessHoursForm } from "../components/hours/BusinessHoursForm";

export const BusinessHoursPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <PageTemplate
      description={t("schedule.hours.description")}
      title={t("schedule.hours.title")}
    >
      <BusinessHoursForm />
    </PageTemplate>
  );
};
