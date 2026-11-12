import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactElement } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  TextareaField,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/shared/constants";
import { isValidationMessageKey } from "@/utils";
import { SUPPORT_TICKET_MAX_REPLY_LENGTH } from "../constants";
import {
  supportTicketReplyFormSchema,
  type SupportTicketReplyFormProps,
  type SupportTicketReplyFormValues,
} from "../models";

export const SupportTicketReplyForm = ({
  isResolved,
  isSubmitting,
  onSubmitReply,
}: SupportTicketReplyFormProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.ADMIN);
  const { t: tValidation } = useTranslation(I18N_NAMESPACE.VALIDATION);

  const form = useForm<SupportTicketReplyFormValues>({
    defaultValues: {
      body: "",
    },
    resolver: zodResolver(supportTicketReplyFormSchema),
  });

  const watchedBody =
    useWatch({
      control: form.control,
      name: "body",
    }) ?? "";

  const isSubmitDisabled = isSubmitting || watchedBody.trim().length === 0;

  if (isResolved) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <Alert variant={ALERT_VARIANT.WARNING}>
          {t("supportTickets.reply.resolvedNotice")}
        </Alert>
      </div>
    );
  }

  const handleFormSubmit = async (
    formValues: SupportTicketReplyFormValues,
  ): Promise<void> => {
    await onSubmitReply(formValues.body);
    form.reset({ body: "" });
  };

  const { ref, ...bodyRegistration } = form.register("body");
  const translatedError =
    form.formState.errors.body?.message &&
    isValidationMessageKey(form.formState.errors.body.message)
      ? tValidation(form.formState.errors.body.message)
      : undefined;

  return (
    <form
      aria-label={t("supportTickets.reply.title")}
      className="space-y-4 rounded-lg border border-border bg-card p-4"
      onSubmit={(event): void => {
        void form.handleSubmit(handleFormSubmit)(event);
      }}
    >
      <h4 className="text-sm font-semibold text-foreground">
        {t("supportTickets.reply.title")}
      </h4>

      <TextareaField
        {...bodyRegistration}
        disabled={isSubmitting}
        error={translatedError}
        id="ticket-reply-body"
        label={t("supportTickets.reply.bodyLabel")}
        maxLength={SUPPORT_TICKET_MAX_REPLY_LENGTH}
        placeholder={t("supportTickets.reply.bodyPlaceholder")}
        ref={ref}
        required={true}
        rows={4}
        showCharacterCount={true}
        value={watchedBody}
      />

      <div className="flex justify-end">
        <Button
          disabled={isSubmitDisabled}
          isLoading={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? t("supportTickets.reply.submitting")
            : t("supportTickets.reply.submitButton")}
        </Button>
      </div>
    </form>
  );
};
