import type { LandingFooterConfig } from "@/modules/landing/layout/models";

/**
 * Representa un canal individual de contacto directo (email o telefono).
 */
export interface ContactChannelItem {
  ariaLabel: string;
  href: string;
  icon: "email" | "phone";
  id: string;
  label: string;
  value: string;
}

/**
 * Representa un enlace oficial a redes sociales.
 */
export interface ContactSocialChannelItem {
  ariaLabel: string;
  network: "facebook" | "instagram" | "linkedin" | "x";
  url: string;
}

/**
 * Retorno del hook useContactChannelsViewModel.
 */
export interface UseContactChannelsViewModelReturn {
  channels: ContactChannelItem[];
  hasAnyChannels: boolean;
  hasChannels: boolean;
  hasSocial: boolean;
  socialLinks: ContactSocialChannelItem[];
}

/**
 * Propiedades del componente ContactDirectChannels.
 */
export interface ContactDirectChannelsProps {
  className?: string;
  configOverride?: LandingFooterConfig;
}
