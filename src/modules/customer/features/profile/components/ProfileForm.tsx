import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  InputField,
  Modal,
} from "@/components/common";
import { I18N_NAMESPACE, type ValidationMessageKey } from "@/constants";
import type { NullableUndefined } from "@/types";
import { PROFILE_PHONE_INVALID_MESSAGE_KEY } from "../constants";
import type { ProfileFormProps } from "../models";

export const ProfileForm = ({ viewModel }: ProfileFormProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { t: tValidation } = useTranslation(I18N_NAMESPACE.VALIDATION);
  const {
    canSubmit,
    email,
    form,
    handleCancel,
    handleDiscardChanges,
    handleKeepEditing,
    handleSubmit,
    isDiscardDialogOpen,
    isSubmitting,
  } = viewModel;

  const resolveError = (
    messageKey?: NullableUndefined<string>,
  ): NullableUndefined<string> => {
    if (!messageKey) return undefined;
    return messageKey === PROFILE_PHONE_INVALID_MESSAGE_KEY
      ? t("profile.edit.phoneInvalidError")
      : tValidation(messageKey as ValidationMessageKey);
  };

  return (
    <>
      <Form {...form}>
        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={handleSubmit}
        >
          <FormField
            control={form.control}
            name="fullName"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <InputField
                    disabled={isSubmitting}
                    error={resolveError(fieldState.error?.message)}
                    label={t("profile.edit.fullNameLabel")}
                    placeholder={t("profile.edit.fullNamePlaceholder")}
                    required
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <InputField
            helperText={t("profile.edit.emailHint")}
            label={t("profile.edit.emailLabel")}
            readOnly
            type="email"
            value={email}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <InputField
                    disabled={isSubmitting}
                    error={resolveError(fieldState.error?.message)}
                    label={t("profile.edit.phoneLabel")}
                    placeholder={t("profile.edit.phonePlaceholder")}
                    required
                    type="tel"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button
              disabled={isSubmitting}
              onClick={handleCancel}
              type="button"
              variant="outline"
            >
              {t("profile.edit.cancelAction")}
            </Button>
            <Button
              disabled={!canSubmit}
              isLoading={isSubmitting}
              type="submit"
              variant="primary"
            >
              {isSubmitting
                ? t("profile.edit.saving")
                : t("profile.edit.saveAction")}
            </Button>
          </div>
        </form>
      </Form>

      <Modal
        isOpen={isDiscardDialogOpen}
        onClose={handleKeepEditing}
        title={t("profile.edit.discardTitle")}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {t("profile.edit.discardConfirm")}
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={handleKeepEditing} type="button" variant="outline">
              {t("profile.edit.keepEditingAction")}
            </Button>
            <Button onClick={handleDiscardChanges} type="button">
              {t("profile.edit.discardAction")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
