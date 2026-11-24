import { FileText } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink } from "@/components";
import { I18N_NAMESPACE, ROUTE_PATH } from "@/constants";

export const CustomerFooterTerms = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);

  return (
    <nav aria-label={t("layout.footer.terms.navigationLabel")}>
      <AppLink
        aria-label={t("layout.footer.terms.linkLabel")}
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        rel="noopener noreferrer"
        target="_blank"
        to={ROUTE_PATH.LANDING.TERMS}
      >
        <FileText aria-hidden="true" className="size-4 text-primary" />
        {t("layout.footer.terms.text")}
      </AppLink>
    </nav>
  );
};
