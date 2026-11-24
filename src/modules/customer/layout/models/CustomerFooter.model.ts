import type { BusinessPublicProfile, SocialNetwork } from "@/domain";
import type { Nullable } from "@/types";

/** Properties accepted by the customer portal footer. */
export interface CustomerFooterProps {
  readonly business?: Nullable<BusinessPublicProfile>;
}

/** Contact item ready to render as an accessible link. */
export interface CustomerFooterContactItem {
  readonly accessibleLabel: string;
  readonly href: string;
  readonly type: "email" | "phone";
  readonly value: string;
}

/** Social item ready to render as a secure external link. */
export interface CustomerFooterSocialItem {
  readonly accessibleLabel: string;
  readonly label: string;
  readonly network: SocialNetwork;
  readonly url: string;
}

/** Presentation state exposed by the customer footer ViewModel. */
export interface CustomerFooterViewModel {
  readonly businessName: Nullable<string>;
  readonly contactItems: readonly CustomerFooterContactItem[];
  readonly handleLogoError: () => void;
  readonly hasContact: boolean;
  readonly hasIdentity: boolean;
  readonly hasSocialLinks: boolean;
  readonly logoUrl: Nullable<string>;
  readonly socialItems: readonly CustomerFooterSocialItem[];
}

/** Properties for the business identity section. */
export interface CustomerFooterIdentityProps {
  readonly businessName: string;
  readonly logoUrl?: Nullable<string>;
  readonly onLogoError: () => void;
}

/** Properties for the contact section. */
export interface CustomerFooterContactProps {
  readonly contactItems: readonly CustomerFooterContactItem[];
}

/** Properties for the social links section. */
export interface CustomerFooterSocialLinksProps {
  readonly socialItems: readonly CustomerFooterSocialItem[];
}
