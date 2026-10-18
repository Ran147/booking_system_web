import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import {
  DEFAULT_LANDING_FOOTER_CONFIG,
  FOOTER_SOCIAL_NETWORK,
  URL_PROTOCOL,
} from "@/modules/landing/layout/constants";
import type { LandingFooterConfig } from "@/modules/landing/layout/models";
import type { Nullable } from "@/shared/types";
import type {
  ContactChannelItem,
  ContactSocialChannelItem,
  UseContactChannelsViewModelReturn,
} from "../components/ContactDirectChannels.types";
import {
  CONTACT_CHANNEL_ICON,
  CONTACT_CHANNEL_TYPE,
} from "../constants/contactChannels.constants";

const SOCIAL_ARIA_KEY_BY_NETWORK = {
  [FOOTER_SOCIAL_NETWORK.FACEBOOK]: "contact.channels.social.facebook",
  [FOOTER_SOCIAL_NETWORK.INSTAGRAM]: "contact.channels.social.instagram",
  [FOOTER_SOCIAL_NETWORK.LINKEDIN]: "contact.channels.social.linkedin",
  [FOOTER_SOCIAL_NETWORK.X]: "contact.channels.social.x",
} as const;

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
 * ViewModel hook para la seccion de canales directos de contacto (US-17 / KAN-17).
 * Centraliza la resolucion de canales desde la configuracion canonica, el filtrado
 * de campos vacios o no configurados, y la generacion de etiquetas accesibles.
 */
export const useContactChannelsViewModel = (
  configOverride?: LandingFooterConfig,
): UseContactChannelsViewModelReturn => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  const effectivePhone = useMemo(() => {
    if (configOverride && "phone" in configOverride) {
      return configOverride.phone?.trim() || null;
    }
    return DEFAULT_LANDING_FOOTER_CONFIG.PHONE;
  }, [configOverride]);

  const effectiveEmail = useMemo(() => {
    if (configOverride && "email" in configOverride) {
      return configOverride.email?.trim() || null;
    }
    return DEFAULT_LANDING_FOOTER_CONFIG.EMAIL;
  }, [configOverride]);

  const effectiveSocialUrls = useMemo(() => {
    if (configOverride && "socialUrls" in configOverride) {
      return configOverride.socialUrls ?? {};
    }
    return DEFAULT_LANDING_FOOTER_CONFIG.SOCIAL_URLS;
  }, [configOverride]);

  const channels: ContactChannelItem[] = useMemo(() => {
    const channelItems: ContactChannelItem[] = [];

    if (effectiveEmail) {
      channelItems.push({
        ariaLabel: t("contact.channels.emailAriaLabel", {
          email: effectiveEmail,
        }),
        href: `mailto:${effectiveEmail}`,
        icon: CONTACT_CHANNEL_ICON.EMAIL,
        id: CONTACT_CHANNEL_TYPE.EMAIL,
        label: t("contact.channels.emailLabel"),
        value: effectiveEmail,
      });
    }

    if (effectivePhone) {
      const sanitizedPhone = effectivePhone.replace(/\s+/g, "");
      channelItems.push({
        ariaLabel: t("contact.channels.phoneAriaLabel", {
          phone: effectivePhone,
        }),
        href: `tel:${sanitizedPhone}`,
        icon: CONTACT_CHANNEL_ICON.PHONE,
        id: CONTACT_CHANNEL_TYPE.PHONE,
        label: t("contact.channels.phoneLabel"),
        value: effectivePhone,
      });
    }

    return channelItems;
  }, [effectiveEmail, effectivePhone, t]);

  const socialLinks: ContactSocialChannelItem[] = useMemo(() => {
    const supportedNetworks = [
      FOOTER_SOCIAL_NETWORK.FACEBOOK,
      FOOTER_SOCIAL_NETWORK.INSTAGRAM,
      FOOTER_SOCIAL_NETWORK.LINKEDIN,
      FOOTER_SOCIAL_NETWORK.X,
    ] as const;

    const activeSocialLinks: ContactSocialChannelItem[] = [];

    for (const network of supportedNetworks) {
      const urlCandidate = effectiveSocialUrls[network];
      if (isValidUrl(urlCandidate)) {
        activeSocialLinks.push({
          ariaLabel: t(SOCIAL_ARIA_KEY_BY_NETWORK[network]),
          network,
          url: urlCandidate!.trim(),
        });
      }
    }

    return activeSocialLinks;
  }, [effectiveSocialUrls, t]);

  const hasChannels = channels.length > 0;
  const hasSocial = socialLinks.length > 0;
  const hasAnyChannels = hasChannels || hasSocial;

  return {
    channels,
    hasAnyChannels,
    hasChannels,
    hasSocial,
    socialLinks,
  };
};
