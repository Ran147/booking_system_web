import { Mail, Phone } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { FooterContactInfo } from "../models";

export interface FooterContactProps {
  readonly contactInfo: FooterContactInfo;
}

export const FooterContact = ({
  contactInfo,
}: FooterContactProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
        {t("footer.contact.title")}
      </h3>
      <ul className="space-y-1">
        {contactInfo.phone && contactInfo.phoneAriaLabel && (
          <li>
            <AppLink
              aria-label={contactInfo.phoneAriaLabel}
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-md px-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              to={`tel:${contactInfo.phone.replace(/\s+/g, "")}`}
            >
              <Phone
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-primary"
              />
              <span>{contactInfo.phone}</span>
            </AppLink>
          </li>
        )}
        {contactInfo.email && contactInfo.emailAriaLabel && (
          <li>
            <AppLink
              aria-label={contactInfo.emailAriaLabel}
              className="inline-flex min-h-[44px] break-all items-center gap-2.5 rounded-md px-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              to={`mailto:${contactInfo.email}`}
            >
              <Mail
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-primary"
              />
              <span>{contactInfo.email}</span>
            </AppLink>
          </li>
        )}
      </ul>
    </div>
  );
};
