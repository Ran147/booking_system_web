import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { InputField } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { SubscriberSignUpSectionProps } from "../models/SubscriberSignUpFormViewModel.interface";

export const PersonalDataSection = ({
  fieldErrors,
  fields,
}: SubscriberSignUpSectionProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-base font-semibold text-foreground">
        {t("subscriberSignUp.form.personalDataTitle")}
      </legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          {...fields.firstName}
          autoComplete="given-name"
          error={fieldErrors.firstName}
          label={t("subscriberSignUp.form.firstNameLabel")}
          required
        />
        <InputField
          {...fields.lastName}
          autoComplete="family-name"
          error={fieldErrors.lastName}
          label={t("subscriberSignUp.form.lastNameLabel")}
          required
        />
      </div>
      <InputField
        {...fields.phone}
        autoComplete="tel"
        error={fieldErrors.phone}
        helperText={t("subscriberSignUp.form.phoneHint")}
        label={t("subscriberSignUp.form.phoneLabel")}
        type="tel"
      />
    </fieldset>
  );
};
