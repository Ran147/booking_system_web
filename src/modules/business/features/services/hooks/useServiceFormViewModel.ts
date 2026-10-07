import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/common";
import { FIRESTORE_COLLECTION, I18N_NAMESPACE } from "@/constants";
import { BUSINESS_STATUS, type BusinessStatus } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { fetchBusinessStatus, useCreateServiceMutation } from "../api";
import {
  SERVICE_FEATURE_LIMIT,
  SERVICE_IMAGE_LIMIT,
} from "../constants/ServiceForm.constants";
import { DEFAULT_SERVICE_FORM_VALUES } from "../constants/ServiceFormDefaults.constants";
import {
  serviceFormSchema,
  type ServiceFormValues,
} from "../models/ServiceForm.schema";
import type { ServiceFormViewModel } from "../models/ServiceFormViewModel.interface";

export interface UseServiceFormViewModelOptions {
  readonly businessStatus?: BusinessStatus;
  readonly onCancel?: () => void;
  readonly onSuccess?: (serviceId: string) => void;
}

export const useServiceFormViewModel = (
  options: UseServiceFormViewModelOptions = {},
): ServiceFormViewModel => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const { businessId } = useCurrentBusiness();
  const createServiceMutation = useCreateServiceMutation();

  const [imageError, setImageError] = useState<Nullable<string>>(null);
  const [selectedImagePreview, setSelectedImagePreview] =
    useState<Nullable<string>>(null);

  const businessStatusQuery = useQuery<BusinessStatus>({
    enabled: options.businessStatus === undefined,
    queryFn: () => fetchBusinessStatus(businessId),
    queryKey: [FIRESTORE_COLLECTION.BUSINESSES, businessId, "status"],
  });

  const effectiveBusinessStatus =
    options.businessStatus ??
    businessStatusQuery.data ??
    BUSINESS_STATUS.ACTIVE;

  const isReadOnly = effectiveBusinessStatus !== BUSINESS_STATUS.ACTIVE;

  const form = useForm<ServiceFormValues>({
    defaultValues: DEFAULT_SERVICE_FORM_VALUES,
    mode: "onBlur",
    resolver: zodResolver(serviceFormSchema) as Resolver<ServiceFormValues>,
  });

  const currentFeatures =
    useWatch({
      control: form.control,
      name: "features",
    }) ?? [];

  const handleFileSelect = (file: Nullable<File>): void => {
    if (!file) return;

    const isAllowedType = (
      SERVICE_IMAGE_LIMIT.ALLOWED_MIME_TYPES as readonly string[]
    ).includes(file.type);
    const isAllowedSize = file.size <= SERVICE_IMAGE_LIMIT.MAX_BYTES;

    if (!isAllowedType || !isAllowedSize) {
      setImageError(t("business:services.form.imageInvalidError"));
      return;
    }

    setImageError(null);
    const objectUrl = URL.createObjectURL(file);
    setSelectedImagePreview(objectUrl);
    form.setValue("imageUrl", objectUrl, { shouldDirty: true });
  };

  const handleRemoveImage = (): void => {
    setImageError(null);
    setSelectedImagePreview(null);
    form.setValue("imageUrl", null, { shouldDirty: true });
  };

  const handleAddFeature = (): void => {
    if (currentFeatures.length >= SERVICE_FEATURE_LIMIT.MAX_ITEMS) return;
    form.setValue("features", [...currentFeatures, ""], {
      shouldDirty: true,
    });
  };

  const handleFeatureChange = (
    targetIndex: number,
    textValue: string,
  ): void => {
    const updatedFeatures = currentFeatures.map((item, index) =>
      index === targetIndex ? textValue : item,
    );
    form.setValue("features", updatedFeatures, { shouldDirty: true });
  };

  const handleMoveFeatureUp = (targetIndex: number): void => {
    if (targetIndex <= 0) return;
    const reordered = [...currentFeatures];
    const temporary = reordered[targetIndex - 1];
    const current = reordered[targetIndex];
    if (temporary !== undefined && current !== undefined) {
      reordered[targetIndex - 1] = current;
      reordered[targetIndex] = temporary;
      form.setValue("features", reordered, { shouldDirty: true });
    }
  };

  const handleMoveFeatureDown = (targetIndex: number): void => {
    if (targetIndex >= currentFeatures.length - 1) return;
    const reordered = [...currentFeatures];
    const temporary = reordered[targetIndex + 1];
    const current = reordered[targetIndex];
    if (temporary !== undefined && current !== undefined) {
      reordered[targetIndex + 1] = current;
      reordered[targetIndex] = temporary;
      form.setValue("features", reordered, { shouldDirty: true });
    }
  };

  const handleRemoveFeature = (targetIndex: number): void => {
    const remainingFeatures = currentFeatures.filter(
      (_item, index) => index !== targetIndex,
    );
    form.setValue("features", remainingFeatures, { shouldDirty: true });
  };

  const submitServiceForm = (formValues: ServiceFormValues): void => {
    if (isReadOnly) {
      toast.error(t("business:errors.readOnly"));
      return;
    }

    const sanitizedFeatures = (formValues.features ?? [])
      .map((feature) => feature.trim())
      .filter((feature) => feature.length > 0);

    createServiceMutation.mutate(
      {
        businessId,
        formValues: {
          ...formValues,
          features: sanitizedFeatures,
        },
      },
      {
        onError: (mutationError) => {
          toast.error(t(`common:${mutationError.messageKey}`));
        },
        onSuccess: (response) => {
          toast.success(t("business:services.form.createSuccess"));
          form.reset(DEFAULT_SERVICE_FORM_VALUES);
          setSelectedImagePreview(null);
          setImageError(null);
          options.onSuccess?.(response.serviceId);
        },
      },
    );
  };

  return {
    canAddFeature: currentFeatures.length < SERVICE_FEATURE_LIMIT.MAX_ITEMS,
    form,
    handleAddFeature,
    handleFeatureChange,
    handleFileSelect,
    handleMoveFeatureDown,
    handleMoveFeatureUp,
    handleRemoveFeature,
    handleRemoveImage,
    handleSubmit: form.handleSubmit(submitServiceForm),
    imageError,
    isReadOnly,
    isSubmitting: createServiceMutation.isPending,
    selectedImagePreview,
  };
};
