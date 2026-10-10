import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  BUSINESS_STATUS,
  SOCIAL_NETWORK,
  type BusinessPublicProfile,
  type SocialLink,
  type SocialNetwork,
} from "@/domain";
import { mapFirebaseError } from "@/services";
import type { Nullable } from "@/types";
import { useSaveBusinessPublicProfileMutation } from "../api/useSaveBusinessPublicProfileMutation";
import type {
  BusinessProfileFormValues,
  BusinessProfileUpdateValues,
  UseBusinessProfileFormReturn,
} from "../models";
import { BusinessProfileFormSchema } from "../schemas/BusinessProfileForm.schema";

const readSocialUrl = (
  socialLinks: SocialLink[],
  network: SocialNetwork,
): string => socialLinks.find((link) => link.network === network)?.url ?? "";

const toNullable = (value: string): Nullable<string> => value || null;

const buildDefaultValues = (
  profile: BusinessPublicProfile,
): BusinessProfileFormValues => ({
  contactEmail: profile.contactEmail ?? "",
  contactPhone: profile.contactPhone ?? "",
  description: profile.description ?? "",
  facebookUrl: readSocialUrl(profile.socialLinks, SOCIAL_NETWORK.FACEBOOK),
  instagramUrl: readSocialUrl(profile.socialLinks, SOCIAL_NETWORK.INSTAGRAM),
  name: profile.name,
  tiktokUrl: readSocialUrl(profile.socialLinks, SOCIAL_NETWORK.TIKTOK),
  websiteUrl: readSocialUrl(profile.socialLinks, SOCIAL_NETWORK.WEBSITE),
  whatsappUrl: readSocialUrl(profile.socialLinks, SOCIAL_NETWORK.WHATSAPP),
});

const buildSocialLinks = (values: BusinessProfileFormValues): SocialLink[] =>
  [
    [SOCIAL_NETWORK.FACEBOOK, values.facebookUrl],
    [SOCIAL_NETWORK.INSTAGRAM, values.instagramUrl],
    [SOCIAL_NETWORK.TIKTOK, values.tiktokUrl],
    [SOCIAL_NETWORK.WEBSITE, values.websiteUrl],
    [SOCIAL_NETWORK.WHATSAPP, values.whatsappUrl],
  ].flatMap(([network, url]) =>
    url ? [{ network: network as SocialNetwork, url }] : [],
  );

export const useBusinessProfileForm = (
  profile: BusinessPublicProfile,
): UseBusinessProfileFormReturn => {
  const [removeLogo, setRemoveLogo] = useState(false);
  const mutation = useSaveBusinessPublicProfileMutation(profile.id);
  const form = useForm<BusinessProfileFormValues>({
    defaultValues: buildDefaultValues(profile),
    resolver: zodResolver(BusinessProfileFormSchema),
  });

  const onSubmit = async (values: BusinessProfileFormValues): Promise<void> => {
    const updateValues: BusinessProfileUpdateValues = {
      contactEmail: toNullable(values.contactEmail),
      contactPhone: toNullable(values.contactPhone),
      description: toNullable(values.description),
      logoUrl: profile.logoUrl,
      name: values.name,
      socialLinks: buildSocialLinks(values),
    };

    try {
      await mutation.mutateAsync({
        businessId: profile.id,
        logoFile: values.logoFile?.item(0) ?? null,
        removeLogo,
        values: updateValues,
      });
    } catch {
      // The mutation state keeps the translated error visible while preserving
      // the values typed in the form for a retry.
    }
  };

  return {
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit,
    isReadOnly: profile.status !== BUSINESS_STATUS.ACTIVE,
    isSaving: mutation.isPending,
    isSuccess: mutation.isSuccess,
    mutationErrorKey: mutation.error
      ? mapFirebaseError(mutation.error).messageKey
      : null,
    onSubmit,
    register: form.register,
    removeLogo,
    setRemoveLogo,
    watch: form.watch,
  };
};
