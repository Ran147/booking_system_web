import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { InputField } from "@/components";
import { I18N_NAMESPACE } from "@/constants";
import { SOCIAL_NETWORK } from "@/domain";
import type { BusinessProfileSocialLinksSectionProps } from "../models";

export const BusinessProfileSocialLinksSection = ({
  errors,
  isReadOnly,
  register,
  validationMessage,
}: BusinessProfileSocialLinksSectionProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("businessProfile.socialLinks.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("businessProfile.socialLinks.helper")}
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {Object.values(SOCIAL_NETWORK).map((network) => {
          const fieldName = `${network}Url` as const;
          return (
            <InputField
              disabled={isReadOnly}
              error={validationMessage(errors[fieldName]?.message)}
              key={network}
              label={t(`businessProfile.socialLinks.${network}Label`)}
              type="url"
              {...register(fieldName)}
            />
          );
        })}
      </div>
    </section>
  );
};
