import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, TextareaField } from "@/components";
import { BUSINESS_PROFILE, I18N_NAMESPACE } from "@/constants";
import type { ValidationMessageKey } from "@/constants";
import type { NullableUndefined } from "@/types";
import { BUSINESS_PROFILE_FORM_FIELD } from "../constants/BusinessProfileForm.constants";
import { useBusinessProfileForm } from "../hooks/useBusinessProfileForm";
import type { BusinessProfileFormProps } from "../models";
import { BusinessProfileContactSection } from "./BusinessProfileContactSection";
import { BusinessProfileIdentitySection } from "./BusinessProfileIdentitySection";
import { BusinessProfileSocialLinksSection } from "./BusinessProfileSocialLinksSection";

export const BusinessProfileForm = ({
  profile,
}: BusinessProfileFormProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const { t: translateCommon } = useTranslation(I18N_NAMESPACE.COMMON);
  const { t: translateValidation } = useTranslation(I18N_NAMESPACE.VALIDATION);
  const {
    errors,
    handleSubmit,
    isReadOnly,
    isSaving,
    isSuccess,
    mutationErrorKey,
    onSubmit,
    register,
    removeLogo,
    setRemoveLogo,
    watch,
  } = useBusinessProfileForm(profile);

  const validationMessage = (message?: string): NullableUndefined<string> =>
    message ? translateValidation(message as ValidationMessageKey) : undefined;

  return (
    <form
      className="mx-auto flex w-full max-w-3xl flex-col gap-8"
      onSubmit={(submitEvent) => void handleSubmit(onSubmit)(submitEvent)}
    >
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-sm font-medium text-primary">
          {t("businessProfile.eyebrow")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("businessProfile.title")}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("businessProfile.description")}
        </p>
      </header>

      {isReadOnly && (
        <p
          className="rounded-lg border border-warning p-4 text-sm"
          role="alert"
        >
          {t("errors.readOnly")}
        </p>
      )}

      <BusinessProfileIdentitySection
        isReadOnly={isReadOnly}
        logoFileError={validationMessage(errors.logoFile?.message)}
        nameError={validationMessage(errors.name?.message)}
        profile={profile}
        register={register}
        removeLogo={removeLogo}
        setRemoveLogo={setRemoveLogo}
      />

      <TextareaField
        disabled={isReadOnly}
        error={validationMessage(errors.description?.message)}
        label={t("businessProfile.descriptionField.label")}
        maxLength={BUSINESS_PROFILE.DESCRIPTION_MAX_LENGTH}
        showCharacterCount
        value={watch("description")}
        {...register(BUSINESS_PROFILE_FORM_FIELD.DESCRIPTION)}
      />

      <BusinessProfileContactSection
        contactEmailError={validationMessage(errors.contactEmail?.message)}
        contactPhoneError={validationMessage(errors.contactPhone?.message)}
        isReadOnly={isReadOnly}
        register={register}
      />

      <BusinessProfileSocialLinksSection
        errors={errors}
        isReadOnly={isReadOnly}
        register={register}
        validationMessage={validationMessage}
      />

      {mutationErrorKey && (
        <p className="text-sm text-destructive" role="alert">
          {translateCommon(mutationErrorKey)}
        </p>
      )}
      {isSuccess && (
        <p className="text-sm text-success" role="status">
          {t("businessProfile.saveSuccess")}
        </p>
      )}

      <div className="flex justify-end border-t border-border pt-6">
        <Button disabled={isReadOnly} isLoading={isSaving} type="submit">
          {t("businessProfile.saveAction")}
        </Button>
      </div>
    </form>
  );
};
