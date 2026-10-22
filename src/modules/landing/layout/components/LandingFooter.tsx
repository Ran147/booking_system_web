import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import { cn } from "@/shared/utils/cn";
import { FooterBranding } from "./FooterBranding";
import { FooterContact } from "./FooterContact";
import { FooterCopyright } from "./FooterCopyright";
import { FooterNavLinks } from "./FooterNavLinks";
import { FooterSocialLinks } from "./FooterSocialLinks";
import { useLandingFooterViewModel } from "../hooks/useLandingFooterViewModel";
import type { LandingFooterProps } from "../models";

export const LandingFooter = ({
  className,
  config,
}: LandingFooterProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const {
    branding,
    contactInfo,
    currentYear,
    handleNavigation,
    hasContact,
    hasNavigation,
    hasSocial,
    navigationLinks,
    socialLinks,
  } = useLandingFooterViewModel(config);

  return (
    <footer
      aria-label={t("footer.landmarkLabel")}
      className={cn(
        "border-t border-border bg-card text-card-foreground transition-colors",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FooterBranding branding={branding} />

          {hasNavigation && (
            <FooterNavLinks
              links={navigationLinks}
              onNavigate={handleNavigation}
            />
          )}

          {hasContact && <FooterContact contactInfo={contactInfo} />}

          {hasSocial && <FooterSocialLinks socialLinks={socialLinks} />}
        </div>

        <FooterCopyright currentYear={currentYear} />
      </div>
    </footer>
  );
};
