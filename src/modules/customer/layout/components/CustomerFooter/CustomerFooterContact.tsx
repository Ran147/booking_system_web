import { Mail, Phone } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { AppLink } from "@/components";
import { I18N_NAMESPACE } from "@/constants";
import { CUSTOMER_FOOTER_CONTACT_TYPE } from "@/modules/customer/layout/constants/CustomerFooter.constants";
import type { CustomerFooterContactProps } from "@/modules/customer/layout/models";

export const CustomerFooterContact = ({
  contactItems,
}: CustomerFooterContactProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);

  return (
    <section aria-labelledby="customer-footer-contact-title">
      <h2
        className="text-sm font-semibold tracking-wider text-foreground uppercase"
        id="customer-footer-contact-title"
      >
        {t("layout.footer.contact.title")}
      </h2>
      <ul className="mt-3 space-y-1">
        {contactItems.map((contactItem) => {
          const ContactIcon =
            contactItem.type === CUSTOMER_FOOTER_CONTACT_TYPE.PHONE
              ? Phone
              : Mail;

          return (
            <li key={contactItem.type}>
              <AppLink
                aria-label={contactItem.accessibleLabel}
                className="inline-flex min-h-11 items-center gap-2.5 rounded-md px-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                to={contactItem.href}
              >
                <ContactIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary"
                />
                <span className="break-all">{contactItem.value}</span>
              </AppLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
