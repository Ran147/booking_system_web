import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import type { Nullable } from "@/types";
import {
  CUSTOMER_FOOTER_CONTACT_TYPE,
  CUSTOMER_FOOTER_URL_PROTOCOL,
} from "../constants/CustomerFooter.constants";
import type {
  CustomerFooterBusiness,
  CustomerFooterContactItem,
  CustomerFooterSocialItem,
  CustomerFooterViewModel,
} from "../models";

const readTrimmedValue = (value?: Nullable<string>): Nullable<string> => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

const isSecureUrl = (urlCandidate: string): boolean => {
  try {
    return (
      new URL(urlCandidate).protocol === CUSTOMER_FOOTER_URL_PROTOCOL.HTTPS
    );
  } catch {
    return false;
  }
};

/** Builds safe, localized presentation state for the customer footer. */
export const useCustomerFooterViewModel = (
  business?: Nullable<CustomerFooterBusiness>,
): CustomerFooterViewModel => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const businessName = readTrimmedValue(business?.name);
  const sourceLogoUrl = readTrimmedValue(business?.logoUrl);
  const [failedLogoUrl, setFailedLogoUrl] = useState<Nullable<string>>(null);

  const contactItems = useMemo<readonly CustomerFooterContactItem[]>(() => {
    const items: CustomerFooterContactItem[] = [];
    const contactEmail = readTrimmedValue(business?.contactEmail);
    const contactPhone = readTrimmedValue(business?.contactPhone);

    if (contactPhone) {
      items.push({
        accessibleLabel: t("layout.footer.contact.phoneLabel", {
          phone: contactPhone,
        }),
        href: `tel:${contactPhone.replace(/\s+/g, "")}`,
        type: CUSTOMER_FOOTER_CONTACT_TYPE.PHONE,
        value: contactPhone,
      });
    }

    if (contactEmail) {
      items.push({
        accessibleLabel: t("layout.footer.contact.emailLabel", {
          email: contactEmail,
        }),
        href: `mailto:${contactEmail}`,
        type: CUSTOMER_FOOTER_CONTACT_TYPE.EMAIL,
        value: contactEmail,
      });
    }

    return items;
  }, [business?.contactEmail, business?.contactPhone, t]);

  const socialItems = useMemo<readonly CustomerFooterSocialItem[]>(() => {
    if (!businessName) return [];

    return (business?.socialLinks ?? []).flatMap((socialLink) => {
      const network = socialLink.network.trim();
      const url = socialLink.url.trim();
      if (!network || !isSecureUrl(url)) return [];

      return [
        {
          accessibleLabel: t("layout.footer.social.linkLabel", {
            businessName,
            network,
          }),
          network,
          url,
        },
      ];
    });
  }, [business?.socialLinks, businessName, t]);

  const handleLogoError = (): void => {
    setFailedLogoUrl(sourceLogoUrl);
  };

  return {
    businessName,
    contactItems,
    handleLogoError,
    hasContact: contactItems.length > 0,
    hasIdentity: businessName !== null,
    hasSocialLinks: socialItems.length > 0,
    logoUrl: failedLogoUrl === sourceLogoUrl ? null : sourceLogoUrl,
    socialItems,
  };
};
