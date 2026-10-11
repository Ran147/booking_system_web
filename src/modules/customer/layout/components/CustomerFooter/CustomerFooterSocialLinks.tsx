import { ExternalLink } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink } from "@/components";
import { I18N_NAMESPACE } from "@/constants";
import type { CustomerFooterSocialLinksProps } from "@/modules/customer/layout/models";

export const CustomerFooterSocialLinks = ({
  socialItems,
}: CustomerFooterSocialLinksProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);

  return (
    <section aria-labelledby="customer-footer-social-title">
      <h2
        className="text-sm font-semibold tracking-wider text-foreground uppercase"
        id="customer-footer-social-title"
      >
        {t("layout.footer.social.title")}
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {socialItems.map((socialItem) => (
          <li key={`${socialItem.network}-${socialItem.url}`}>
            <AppLink
              aria-label={socialItem.accessibleLabel}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              rel="noopener noreferrer"
              target="_blank"
              to={socialItem.url}
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              <span>{socialItem.network}</span>
            </AppLink>
          </li>
        ))}
      </ul>
    </section>
  );
};
