import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { InputField } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { BusinessSectionProps } from "../models/BusinessSectionProps.interface";

export const BusinessSection = ({
  businessAddress,
  fieldErrors,
  fields,
}: BusinessSectionProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-base font-semibold text-foreground">
        {t("subscriberSignUp.form.businessTitle")}
      </legend>
      <InputField
        {...fields.businessName}
        autoComplete="organization"
        error={fieldErrors.businessName}
        label={t("subscriberSignUp.form.businessNameLabel")}
        required
      />
      <InputField
        {...fields.businessSlug}
        autoCapitalize="none"
        autoComplete="off"
        error={fieldErrors.businessSlug}
        helperText={t("subscriberSignUp.form.businessSlugHint", {
          businessAddress,
        })}
        label={t("subscriberSignUp.form.businessSlugLabel")}
        required
        spellCheck={false}
      />
    </fieldset>
  );
};
