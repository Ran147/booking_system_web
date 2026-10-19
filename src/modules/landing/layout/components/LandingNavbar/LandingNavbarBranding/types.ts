/**
 * @file Type definitions and props for LandingNavbarBranding component.
 */

/**
 * Properties for LandingNavbarBranding.
 */
export interface LandingNavbarBrandingProps {
  readonly brandName: string;
  readonly hasImageError?: boolean;
  readonly logoAlt: string;
  readonly logoUrl?: string;
  readonly onImageError?: () => void;
}
