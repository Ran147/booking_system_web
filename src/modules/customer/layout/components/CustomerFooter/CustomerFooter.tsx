import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { useCustomerFooterViewModel } from "@/modules/customer/layout/hooks/useCustomerFooterViewModel";
import type { CustomerFooterProps } from "@/modules/customer/layout/models";
import { CustomerFooterContact } from "./CustomerFooterContact";
import { CustomerFooterIdentity } from "./CustomerFooterIdentity";
import { CustomerFooterSocialLinks } from "./CustomerFooterSocialLinks";
import { CustomerFooterTerms } from "./CustomerFooterTerms";

export const CustomerFooter = ({
  business = null,
}: CustomerFooterProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const {
    businessName,
    contactItems,
    handleLogoError,
    hasContact,
    hasIdentity,
    hasSocialLinks,
    logoUrl,
    socialItems,
  } = useCustomerFooterViewModel(business);

  return (
    <footer
      aria-label={t("layout.footer.landmarkLabel")}
      className="border-t border-border bg-card text-card-foreground"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {hasIdentity && businessName ? (
          <CustomerFooterIdentity
            businessName={businessName}
            logoUrl={logoUrl}
            onLogoError={handleLogoError}
          />
        ) : null}

        {hasContact ? (
          <CustomerFooterContact contactItems={contactItems} />
        ) : null}

        {hasSocialLinks ? (
          <CustomerFooterSocialLinks socialItems={socialItems} />
        ) : null}

        <CustomerFooterTerms />
      </div>
    </footer>
  );
};
