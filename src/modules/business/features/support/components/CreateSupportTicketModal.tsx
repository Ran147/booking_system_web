import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_VARIANT,
  InputField,
  Modal,
  MODAL_MAX_WIDTH,
  TextareaField,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { CreateSupportTicketModalProps } from "./CreateSupportTicketModal.types";
import { SUPPORT_LIMITS } from "../constants/Support.constants";
import { useCreateSupportTicketFormViewModel } from "../hooks/useCreateSupportTicketFormViewModel";

export const CreateSupportTicketModal = ({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateSupportTicketModalProps): JSX.Element => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const viewModel = useCreateSupportTicketFormViewModel({
    isSubmitting,
    onClose,
    onSubmit,
  });

  return (
    <Modal
      isOpen={isOpen}
      maxWidth={MODAL_MAX_WIDTH.LG}
      onClose={viewModel.handleModalClose}
      title={t("support.create.title")}
    >
      <form
        aria-label={t("support.create.title")}
        className="space-y-4"
        onSubmit={(event): void => {
          void viewModel.handleSubmit(event);
        }}
      >
        <p className="text-sm text-muted-foreground">
          {t("support.create.description")}
        </p>

        <InputField
          {...viewModel.subjectRegistration}
          aria-label={t("support.create.subjectLabel")}
          disabled={isSubmitting}
          error={viewModel.subjectError}
          id="ticket-subject"
          label={t("support.create.subjectLabel")}
          maxLength={SUPPORT_LIMITS.SUBJECT_MAX_LENGTH}
          placeholder={t("support.create.subjectPlaceholder")}
          required={true}
          value={viewModel.watchedSubject}
        />

        <TextareaField
          {...viewModel.messageRegistration}
          aria-label={t("support.create.messageLabel")}
          disabled={isSubmitting}
          error={viewModel.messageError}
          id="ticket-message"
          label={t("support.create.messageLabel")}
          maxLength={SUPPORT_LIMITS.MESSAGE_MAX_LENGTH}
          placeholder={t("support.create.messagePlaceholder")}
          required={true}
          rows={5}
          showCharacterCount={true}
          value={viewModel.watchedMessage}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            disabled={isSubmitting}
            onClick={viewModel.handleModalClose}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("support.actions.cancel")}
          </Button>
          <Button
            disabled={viewModel.isSubmitDisabled}
            isLoading={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? t("support.actions.creating")
              : t("support.actions.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
