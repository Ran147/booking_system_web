import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import type { ErrorMessageKey } from "@/constants";
import type { BusinessPublicProfile, SocialLink } from "@/domain";
import type { Nullable, NullableUndefined } from "@/types";

/** Values managed by the business public profile form. */
export interface BusinessProfileFormValues {
  /** Contact email input value. */
  contactEmail: string;
  /** Contact phone input value. */
  contactPhone: string;
  /** Public description input value. */
  description: string;
  /** Facebook URL input value. */
  facebookUrl: string;
  /** Instagram URL input value. */
  instagramUrl: string;
  /** Optional logo selected by the user. */
  logoFile?: FileList;
  /** Business name input value. */
  name: string;
  /** TikTok URL input value. */
  tiktokUrl: string;
  /** Website URL input value. */
  websiteUrl: string;
  /** WhatsApp URL input value. */
  whatsappUrl: string;
}

/** Validated public profile fields sent to Firestore. */
export interface BusinessProfileUpdateValues {
  /** Normalized optional contact email. */
  contactEmail: Nullable<string>;
  /** Normalized optional contact phone. */
  contactPhone: Nullable<string>;
  /** Normalized optional public description. */
  description: Nullable<string>;
  /** Existing or newly uploaded logo URL. */
  logoUrl: Nullable<string>;
  /** Validated public business name. */
  name: string;
  /** Validated configured social links. */
  socialLinks: SocialLink[];
}

/** Input required to persist a business public profile. */
export interface SaveBusinessPublicProfileInput {
  /** Authenticated business document identifier. */
  businessId: string;
  /** Optional new logo selected by the user. */
  logoFile: Nullable<File>;
  /** Whether the existing logo should be removed. */
  removeLogo: boolean;
  /** Validated values written to the business document. */
  values: BusinessProfileUpdateValues;
}

/** Props for the complete business profile form. */
export interface BusinessProfileFormProps {
  /** Current profile loaded for the authenticated business. */
  profile: BusinessPublicProfile;
}

/** Props for the logo image or initials fallback. */
export interface BusinessLogoPreviewProps {
  /** Current profile used for the logo URL and accessible name. */
  profile: BusinessPublicProfile;
  /** Whether the existing logo is marked for removal. */
  removed: boolean;
}

/** Props for the identity and logo section of the form. */
export interface BusinessProfileIdentitySectionProps {
  /** Whether editing is disabled by the business status. */
  isReadOnly: boolean;
  /** Translated logo validation message. */
  logoFileError: NullableUndefined<string>;
  /** Translated name validation message. */
  nameError: NullableUndefined<string>;
  /** Current profile displayed by the section. */
  profile: BusinessPublicProfile;
  /** React Hook Form field registration function. */
  register: UseFormRegister<BusinessProfileFormValues>;
  /** Whether the existing logo is marked for removal. */
  removeLogo: boolean;
  /** Updates whether the existing logo should be removed. */
  setRemoveLogo: (removeLogo: boolean) => void;
}

/** Props for the business contact section. */
export interface BusinessProfileContactSectionProps {
  /** Translated email validation message. */
  contactEmailError: NullableUndefined<string>;
  /** Translated phone validation message. */
  contactPhoneError: NullableUndefined<string>;
  /** Whether editing is disabled by the business status. */
  isReadOnly: boolean;
  /** React Hook Form field registration function. */
  register: UseFormRegister<BusinessProfileFormValues>;
}

/** Props for the social links section. */
export interface BusinessProfileSocialLinksSectionProps {
  /** Current React Hook Form validation errors. */
  errors: FieldErrors<BusinessProfileFormValues>;
  /** Whether editing is disabled by the business status. */
  isReadOnly: boolean;
  /** React Hook Form field registration function. */
  register: UseFormRegister<BusinessProfileFormValues>;
  /** Resolves a schema message key to translated text. */
  validationMessage: (message?: string) => NullableUndefined<string>;
}

/** Public state and handlers exposed by the profile form hook. */
export interface UseBusinessProfileFormReturn {
  /** Current form validation errors. */
  errors: FieldErrors<BusinessProfileFormValues>;
  /** React Hook Form submit wrapper. */
  handleSubmit: UseFormHandleSubmit<BusinessProfileFormValues>;
  /** Whether editing is disabled by the business status. */
  isReadOnly: boolean;
  /** Whether a save operation is in progress. */
  isSaving: boolean;
  /** Whether the latest save operation succeeded. */
  isSuccess: boolean;
  /** Translatable Firebase error key from the latest save attempt. */
  mutationErrorKey: Nullable<ErrorMessageKey>;
  /** Submits normalized form values to the mutation. */
  onSubmit: (values: BusinessProfileFormValues) => Promise<void>;
  /** React Hook Form field registration function. */
  register: UseFormRegister<BusinessProfileFormValues>;
  /** Whether the existing logo is marked for removal. */
  removeLogo: boolean;
  /** Updates whether the existing logo should be removed. */
  setRemoveLogo: (removeLogo: boolean) => void;
  /** Watches current React Hook Form values. */
  watch: UseFormWatch<BusinessProfileFormValues>;
}
