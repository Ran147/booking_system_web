import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { InputField } from "@/components";
import { I18N_NAMESPACE } from "@/constants";
import { BUSINESS_PROFILE_FORM_FIELD } from "../constants/BusinessProfileForm.constants";
import type { BusinessProfileContactSectionProps } from "../models";

export const BusinessProfileContactSection = ({
  contactEmailError,
  contactPhoneError,
  isReadOnly,
  register,
}: BusinessProfileContactSectionProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">
        {t("businessProfile.contact.title")}
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          disabled={isReadOnly}
          error={contactPhoneError}
          label={t("businessProfile.contact.phoneLabel")}
          type="tel"
          {...register(BUSINESS_PROFILE_FORM_FIELD.CONTACT_PHONE)}
        />
        <InputField
          disabled={isReadOnly}
          error={contactEmailError}
          label={t("businessProfile.contact.emailLabel")}
          type="email"
          {...register(BUSINESS_PROFILE_FORM_FIELD.CONTACT_EMAIL)}
        />
      </div>
    </section>
  );
};
