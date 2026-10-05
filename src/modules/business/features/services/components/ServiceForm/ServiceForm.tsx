import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  InputField,
  TextareaField,
} from "@/components/common";
import { I18N_NAMESPACE, type ValidationMessageKey } from "@/constants";
import { SERVICE_FIELD_LIMIT } from "@/modules/business/features/services";
import type { NullableUndefined } from "@/types";
import { ServiceFeatureList } from "../ServiceFeatureList";
import { ServiceImageUploader } from "../ServiceImageUploader";
import type { ServiceFormProps } from "./types";

export const ServiceForm = ({
  onCancel,
  viewModel,
}: ServiceFormProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const { t: tValidation } = useTranslation(I18N_NAMESPACE.VALIDATION);

  const {
    canAddFeature,
    form,
    handleAddFeature,
    handleFeatureChange,
    handleFileSelect,
    handleMoveFeatureDown,
    handleMoveFeatureUp,
    handleRemoveFeature,
    handleRemoveImage,
    handleSubmit,
    imageError,
    isReadOnly,
    isSubmitting,
    selectedImagePreview,
  } = viewModel;

  const currentFeatures = form.watch("features") ?? [];

  const resolveErrorMessage = (
    messageKey?: NullableUndefined<string>,
  ): NullableUndefined<string> => {
    if (!messageKey) return undefined;
    return tValidation(messageKey as ValidationMessageKey);
  };

  return (
    <Form {...form}>
      <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <InputField
                  disabled={isSubmitting || isReadOnly}
                  error={resolveErrorMessage(fieldState.error?.message)}
                  label={t("services.form.nameLabel")}
                  placeholder={t("services.form.namePlaceholder")}
                  required
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <TextareaField
                  disabled={isSubmitting || isReadOnly}
                  error={resolveErrorMessage(fieldState.error?.message)}
                  label={t("services.form.descriptionLabel")}
                  maxLength={SERVICE_FIELD_LIMIT.DESCRIPTION_MAX_LENGTH}
                  placeholder={t("services.form.descriptionPlaceholder")}
                  rows={3}
                  showCharacterCount
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <InputField
                    disabled={isSubmitting || isReadOnly}
                    error={resolveErrorMessage(fieldState.error?.message)}
                    helperText={t("services.form.priceHelp")}
                    label={t("services.form.priceLabel")}
                    placeholder={t("services.form.pricePlaceholder")}
                    required
                    step="0.01"
                    type="number"
                    {...field}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value === "" ? "" : Number(value));
                    }}
                    value={field.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <InputField
                    disabled={isSubmitting || isReadOnly}
                    error={resolveErrorMessage(fieldState.error?.message)}
                    helperText={t("services.form.durationHelp")}
                    label={t("services.form.durationLabel")}
                    placeholder={t("services.form.durationPlaceholder")}
                    required
                    step={SERVICE_FIELD_LIMIT.DURATION_STEP_MINUTES}
                    type="number"
                    {...field}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value === "" ? "" : Number(value));
                    }}
                    value={field.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <ServiceImageUploader
          disabled={isSubmitting || isReadOnly}
          errorMessage={imageError}
          onFileSelect={handleFileSelect}
          onRemoveImage={handleRemoveImage}
          previewUrl={selectedImagePreview}
        />

        <ServiceFeatureList
          canAddFeature={canAddFeature}
          disabled={isSubmitting || isReadOnly}
          features={currentFeatures}
          onAddFeature={handleAddFeature}
          onFeatureChange={handleFeatureChange}
          onMoveDown={handleMoveFeatureDown}
          onMoveUp={handleMoveFeatureUp}
          onRemoveFeature={handleRemoveFeature}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          {onCancel && (
            <Button
              disabled={isSubmitting}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              {t("services.form.cancelAction")}
            </Button>
          )}

          <Button
            disabled={isSubmitting || isReadOnly}
            isLoading={isSubmitting}
            type="submit"
            variant="primary"
          >
            {isSubmitting
              ? t("services.form.submitting")
              : t("services.form.submitAction")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
