import type { ReactElement } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InputField,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { CollaboratorFormValues } from "../models";

interface CollaboratorFormFieldsProps {
  readonly form: UseFormReturn<CollaboratorFormValues>;
  readonly isEmailLocked: boolean;
  readonly isReadOnly: boolean;
  readonly isSubmitting: boolean;
}

export const CollaboratorFormFields = ({
  form,
  isEmailLocked,
  isReadOnly,
  isSubmitting,
}: CollaboratorFormFieldsProps): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("business:collaborators.form.fullNameLabel")}
            </FormLabel>
            <FormControl>
              <InputField
                {...field}
                disabled={isReadOnly || isSubmitting}
                placeholder={t(
                  "business:collaborators.form.fullNamePlaceholder",
                )}
                type="text"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("business:collaborators.form.emailLabel")}</FormLabel>
            <FormControl>
              <InputField
                {...field}
                disabled={isReadOnly || isEmailLocked || isSubmitting}
                helperText={
                  isEmailLocked
                    ? t("business:collaborators.edit.emailLockedHint")
                    : undefined
                }
                placeholder={t("business:collaborators.form.emailPlaceholder")}
                type="email"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("business:collaborators.form.phoneLabel")}</FormLabel>
            <FormControl>
              <InputField
                {...field}
                disabled={isReadOnly || isSubmitting}
                placeholder={t("business:collaborators.form.phonePlaceholder")}
                type="tel"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="specialty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("business:collaborators.form.specialtyLabel")}
            </FormLabel>
            <FormControl>
              <InputField
                {...field}
                disabled={isReadOnly || isSubmitting}
                placeholder={t(
                  "business:collaborators.form.specialtyPlaceholder",
                )}
                type="text"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
