import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { FooterNavLinksProps } from "./types";

export const FooterNavLinks = ({
  links,
  onNavigate,
}: FooterNavLinksProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <nav aria-label={t("footer.links.title")} className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
        {t("footer.links.title")}
      </h3>
      <ul className="space-y-1">
        {links.map((linkItem) => (
          <li key={linkItem.id}>
            <AppLink
              className="inline-flex min-h-[44px] items-center rounded-md px-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={(event): void => onNavigate(event, linkItem.href)}
              to={linkItem.href}
            >
              {linkItem.label}
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
