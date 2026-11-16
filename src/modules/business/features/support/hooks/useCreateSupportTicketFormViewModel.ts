import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { isValidationMessageKey } from "@/utils";
import {
  createSupportTicketFormSchema,
  type CreateSupportTicketFormSchema,
} from "../api";
import type { CreateSupportTicketFormValues } from "../models";

interface UseCreateSupportTicketFormViewModelOptions {
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (values: CreateSupportTicketFormValues) => Promise<void>;
}

export interface CreateSupportTicketFormViewModel {
  readonly handleModalClose: () => void;
  readonly handleSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  readonly isSubmitDisabled: boolean;
  readonly messageError?: string;
  readonly messageRegistration: UseFormRegisterReturn<"message">;
  readonly subjectError?: string;
  readonly subjectRegistration: UseFormRegisterReturn<"subject">;
  readonly watchedMessage: string;
  readonly watchedSubject: string;
}

export const useCreateSupportTicketFormViewModel = ({
  isSubmitting,
  onClose,
  onSubmit,
}: UseCreateSupportTicketFormViewModelOptions): CreateSupportTicketFormViewModel => {
  const { t: tValidation } = useTranslation(I18N_NAMESPACE.VALIDATION);

  const form = useForm<CreateSupportTicketFormSchema>({
    defaultValues: {
      message: "",
      subject: "",
    },
    resolver: zodResolver(createSupportTicketFormSchema),
  });

  const watchedSubject =
    useWatch({
      control: form.control,
      name: "subject",
    }) ?? "";

  const watchedMessage =
    useWatch({
      control: form.control,
      name: "message",
    }) ?? "";

  const isSubmitDisabled =
    isSubmitting ||
    watchedSubject.trim().length === 0 ||
    watchedMessage.trim().length === 0;

  const handleFormSubmit = async (
    formValues: CreateSupportTicketFormSchema,
  ): Promise<void> => {
    await onSubmit(formValues);
    form.reset({ message: "", subject: "" });
  };

  const handleModalClose = (): void => {
    form.reset({ message: "", subject: "" });
    onClose();
  };

  const subjectError =
    form.formState.errors.subject?.message &&
    isValidationMessageKey(form.formState.errors.subject.message)
      ? tValidation(form.formState.errors.subject.message)
      : undefined;

  const messageError =
    form.formState.errors.message?.message &&
    isValidationMessageKey(form.formState.errors.message.message)
      ? tValidation(form.formState.errors.message.message)
      : undefined;

  return {
    handleModalClose,
    handleSubmit: form.handleSubmit(handleFormSubmit),
    isSubmitDisabled,
    messageError,
    messageRegistration: form.register("message"),
    subjectError,
    subjectRegistration: form.register("subject"),
    watchedMessage,
    watchedSubject,
  };
};
