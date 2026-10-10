import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  InputField,
  PasswordInput,
  PasswordStrengthMeter,
} from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { AccountSectionProps } from "../models/AccountSectionProps.interface";

export const AccountSection = ({
  fieldErrors,
  fields,
  password,
}: AccountSectionProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-base font-semibold text-foreground">
        {t("subscriberSignUp.form.accountTitle")}
      </legend>
      <InputField
        {...fields.email}
        autoComplete="email"
        helperText={t("subscriberSignUp.form.emailHint")}
        label={t("subscriberSignUp.form.emailLabel")}
        readOnly
        type="email"
      />
      <PasswordInput
        {...fields.password}
        autoComplete="new-password"
        error={fieldErrors.password}
        label={t("subscriberSignUp.form.passwordLabel")}
        required
      />
      <PasswordStrengthMeter password={password} />
      <PasswordInput
        {...fields.passwordConfirmation}
        autoComplete="new-password"
        error={fieldErrors.passwordConfirmation}
        label={t("subscriberSignUp.form.passwordConfirmationLabel")}
        required
      />
    </fieldset>
  );
};
