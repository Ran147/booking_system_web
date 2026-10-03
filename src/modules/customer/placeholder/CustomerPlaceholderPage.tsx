import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageTemplate } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";

// Temporary portal home. Replace it with the first feature route of this
// portal and delete the placeholder folder.
export const CustomerPlaceholderPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);

  return (
    <PageTemplate
      description={t("placeholder.description")}
      title={t("placeholder.title")}
    />
  );
};
