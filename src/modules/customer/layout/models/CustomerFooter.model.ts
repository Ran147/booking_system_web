import type { Nullable } from "@/types";

/** Social link received from the public business profile. */
export interface CustomerFooterSocialLink {
  readonly network: string;
  readonly url: string;
}

/** Minimum business projection required to render the customer footer. */
export interface CustomerFooterBusiness {
  readonly contactEmail?: Nullable<string>;
  readonly contactPhone?: Nullable<string>;
  readonly logoUrl?: Nullable<string>;
  readonly name: string;
  readonly socialLinks?: readonly CustomerFooterSocialLink[];
}

/** Properties accepted by the customer portal footer. */
export interface CustomerFooterProps {
  readonly business?: Nullable<CustomerFooterBusiness>;
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
  readonly network: string;
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
