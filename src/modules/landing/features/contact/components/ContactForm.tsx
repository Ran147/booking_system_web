import { CheckCircle2, AlertCircle } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  InputField,
  RecaptchaField,
  TextareaField,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { cn } from "@/utils/cn";
import { CONTACT_FORM_CONSTANTS } from "../constants/contactForm.constants";
import { useContactFormViewModel } from "../hooks/useContactFormViewModel";
import type { ContactFormProps } from "../models/contactForm.model";

export const ContactForm = ({
  className,
  onSubmitSuccess,
}: ContactFormProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const {
    fieldErrors,
    handleDismissFeedback,
    handleRecaptchaTokenChange,
    handleSubmit,
    isSubmitDisabled,
    isSubmitting,
    isSuccess,
    language,
    recaptchaResetSignal,
    recaptchaSiteKey,
    register,
    serverError,
  } = useContactFormViewModel({ onSubmitSuccess });

  return (
    <form
      aria-label={t("contact.form.title")}
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8",
        className,
      )}
      id={CONTACT_FORM_CONSTANTS.FORM_ID}
      noValidate
      onSubmit={handleSubmit}
    >
      {isSuccess && (
        <Alert
          className="flex items-center justify-between gap-3"
          variant={ALERT_VARIANT.SUCCESS}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <span>{t("contact.form.success")}</span>
          </div>
          <Button
            ariaLabel={t("contact.form.dismissAlert")}
            className="h-auto p-0 text-xs text-muted-foreground underline hover:text-foreground"
            onClick={handleDismissFeedback}
            size={BUTTON_SIZE.SM}
            type="button"
            variant={BUTTON_VARIANT.LINK}
          >
            {t("contact.form.dismissAction")}
          </Button>
        </Alert>
      )}

      {serverError && (
        <Alert
          className="flex items-center justify-between gap-3"
          variant={ALERT_VARIANT.DESTRUCTIVE}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 shrink-0 text-destructive" />
            <span>{serverError}</span>
          </div>
          <Button
            ariaLabel={t("contact.form.dismissAlert")}
            className="h-auto p-0 text-xs underline hover:opacity-80"
            onClick={handleDismissFeedback}
            size={BUTTON_SIZE.SM}
            type="button"
            variant={BUTTON_VARIANT.LINK}
          >
            {t("contact.form.dismissAction")}
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <InputField
          autoComplete="name"
          error={fieldErrors.name}
          id="contact-name"
          label={t("contact.form.nameLabel")}
          placeholder={t("contact.form.namePlaceholder")}
          required
          {...register(CONTACT_FORM_CONSTANTS.FIELD_NAMES.NAME)}
        />
        <InputField
          autoComplete="email"
          error={fieldErrors.email}
          id="contact-email"
          label={t("contact.form.emailLabel")}
          placeholder={t("contact.form.emailPlaceholder")}
          required
          type="email"
          {...register(CONTACT_FORM_CONSTANTS.FIELD_NAMES.EMAIL)}
        />
      </div>

      <InputField
        autoComplete="off"
        error={fieldErrors.subject}
        id="contact-subject"
        label={t("contact.form.subjectLabel")}
        placeholder={t("contact.form.subjectPlaceholder")}
        required
        {...register(CONTACT_FORM_CONSTANTS.FIELD_NAMES.SUBJECT)}
      />

      <TextareaField
        error={fieldErrors.message}
        id="contact-message"
        label={t("contact.form.messageLabel")}
        maxLength={CONTACT_FORM_CONSTANTS.FIELD_LIMITS.MESSAGE_MAX_LENGTH}
        placeholder={t("contact.form.messagePlaceholder")}
        required
        rows={4}
        {...register(CONTACT_FORM_CONSTANTS.FIELD_NAMES.MESSAGE)}
      />

      <RecaptchaField
        label={t("contact.form.recaptchaLabel")}
        language={language}
        onTokenChange={handleRecaptchaTokenChange}
        resetSignal={recaptchaResetSignal}
        siteKey={recaptchaSiteKey}
      />

      <Button
        disabled={isSubmitDisabled}
        fullWidth
        isLoading={isSubmitting}
        type="submit"
      >
        {t("contact.form.submitButton")}
      </Button>
    </form>
  );
};
