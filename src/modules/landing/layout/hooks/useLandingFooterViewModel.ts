import { type MouseEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { Nullable, NullableUndefined } from "@/shared/types";
import {
  DEFAULT_LANDING_FOOTER_CONFIG,
  FOOTER_NAVIGATION_ITEMS,
  FOOTER_SOCIAL_NETWORK,
  URL_PROTOCOL,
} from "../constants";
import type {
  FooterBrandingInfo,
  FooterContactInfo,
  FooterNavigationLinkItem,
  FooterSocialLinkItem,
  FooterSocialNetwork,
  LandingFooterConfig,
  UseLandingFooterViewModelReturn,
} from "../models";

const isValidUrl = (urlCandidate?: Nullable<string>): boolean => {
  if (!urlCandidate || urlCandidate.trim() === "") {
    return false;
  }

  try {
    const parsedUrl = new URL(urlCandidate);
    return (
      parsedUrl.protocol === URL_PROTOCOL.HTTP ||
      parsedUrl.protocol === URL_PROTOCOL.HTTPS
    );
  } catch {
    return false;
  }
};

/**
 * ViewModel hook for the Landing Portal Footer (KAN-8, KAN-196).
 * Encapsulates data formatting, unconfigured item omissions, and navigation behaviors.
 */
export const useLandingFooterViewModel = (
  configOverride?: LandingFooterConfig,
): UseLandingFooterViewModelReturn => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  const effectivePhone =
    configOverride && "phone" in configOverride
      ? configOverride.phone?.trim() || null
      : DEFAULT_LANDING_FOOTER_CONFIG.PHONE;

  const effectiveEmail =
    configOverride && "email" in configOverride
      ? configOverride.email?.trim() || null
      : DEFAULT_LANDING_FOOTER_CONFIG.EMAIL;

  const effectiveSocialUrls = useMemo(() => {
    if (configOverride && "socialUrls" in configOverride) {
      return configOverride.socialUrls ?? {};
    }
    return DEFAULT_LANDING_FOOTER_CONFIG.SOCIAL_URLS;
  }, [configOverride]);

  const branding: FooterBrandingInfo = useMemo(
    () => ({
      description: t("footer.branding.description"),
      logoAlt: t("footer.branding.logoAlt"),
      name: t("footer.brandName"),
    }),
    [t],
  );

  const contactInfo: FooterContactInfo = useMemo(
    () => ({
      email: effectiveEmail,
      emailAriaLabel: effectiveEmail
        ? t("footer.contact.emailLabel", { email: effectiveEmail })
        : null,
      phone: effectivePhone,
      phoneAriaLabel: effectivePhone
        ? t("footer.contact.phoneLabel", { phone: effectivePhone })
        : null,
    }),
    [effectiveEmail, effectivePhone, t],
  );

  const navigationLinks: FooterNavigationLinkItem[] = useMemo(
    () =>
      FOOTER_NAVIGATION_ITEMS.map((navigationItem) => ({
        href: navigationItem.HREF,
        id: navigationItem.ID,
        label: t(navigationItem.LABEL_KEY),
      })),
    [t],
  );

  const socialLinks: FooterSocialLinkItem[] = useMemo(() => {
    const networks: FooterSocialNetwork[] = [
      FOOTER_SOCIAL_NETWORK.FACEBOOK,
      FOOTER_SOCIAL_NETWORK.INSTAGRAM,
      FOOTER_SOCIAL_NETWORK.LINKEDIN,
      FOOTER_SOCIAL_NETWORK.X,
    ];

    const validSocialLinks: FooterSocialLinkItem[] = [];

    for (const network of networks) {
      const candidateUrl =
        effectiveSocialUrls[network] ??
        (effectiveSocialUrls as Record<string, NullableUndefined<string>>)[
          network.toUpperCase()
        ];
      if (candidateUrl && isValidUrl(candidateUrl)) {
        validSocialLinks.push({
          ariaLabel: t(`footer.social.${network}`),
          network,
          url: candidateUrl,
        });
      }
    }

    return validSocialLinks;
  }, [effectiveSocialUrls, t]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const handleNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ): void => {
    if (href.startsWith("#")) {
      event.preventDefault();
      const targetElement = document.querySelector<HTMLElement>(href);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
        targetElement.focus();
      }
      return;
    }

    const hashIndex = href.indexOf("#");
    if (hashIndex !== -1) {
      const hash = href.substring(hashIndex);
      const targetElement = document.querySelector<HTMLElement>(hash);
      if (targetElement) {
        event.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth" });
        targetElement.focus();
      }
    }
  };

  const hasContact = contactInfo.phone !== null || contactInfo.email !== null;
  const hasNavigation = navigationLinks.length > 0;
  const hasSocial = socialLinks.length > 0;

  return {
    branding,
    contactInfo,
    currentYear,
    handleNavigation,
    hasContact,
    hasNavigation,
    hasSocial,
    navigationLinks,
    socialLinks,
  };
};
