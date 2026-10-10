import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, InputField } from "@/components";
import { BUSINESS_PROFILE, I18N_NAMESPACE } from "@/constants";
import { BUSINESS_PROFILE_FORM_FIELD } from "../constants/BusinessProfileForm.constants";
import type { BusinessProfileIdentitySectionProps } from "../models";
import { BusinessLogoPreview } from "./BusinessLogoPreview";

export const BusinessProfileIdentitySection = ({
  isReadOnly,
  logoFileError,
  nameError,
  profile,
  register,
  removeLogo,
  setRemoveLogo,
}: BusinessProfileIdentitySectionProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <>
      <section className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <BusinessLogoPreview profile={profile} removed={removeLogo} />
        <div className="space-y-3">
          <InputField
            accept={BUSINESS_PROFILE.VALID_LOGO_TYPES.join(",")}
            disabled={isReadOnly}
            error={logoFileError}
            helperText={t("businessProfile.logo.helper")}
            label={t("businessProfile.logo.label")}
            type="file"
            {...register(BUSINESS_PROFILE_FORM_FIELD.LOGO_FILE)}
          />
          {profile.logoUrl && !removeLogo && (
            <Button
              disabled={isReadOnly}
              onClick={() => setRemoveLogo(true)}
              variant="outline"
            >
              {t("businessProfile.logo.removeAction")}
            </Button>
          )}
          {removeLogo && (
            <Button onClick={() => setRemoveLogo(false)} variant="ghost">
              {t("businessProfile.logo.undoAction")}
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <InputField
          disabled={isReadOnly}
          error={nameError}
          label={t("businessProfile.name.label")}
          required
          {...register(BUSINESS_PROFILE_FORM_FIELD.NAME)}
        />
        <InputField
          disabled
          helperText={t("businessProfile.slug.readOnlyHint")}
          label={t("businessProfile.slug.label")}
          value={`/${profile.slug}`}
        />
      </section>
    </>
  );
};
