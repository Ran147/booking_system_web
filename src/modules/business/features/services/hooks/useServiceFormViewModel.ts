import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/common";
import {
  FIRESTORE_COLLECTION,
  I18N_NAMESPACE,
  MONEY,
  STRING,
} from "@/constants";
import { BUSINESS_STATUS, type BusinessStatus } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import {
  fetchBusinessStatus,
  useCreateServiceMutation,
  useServiceDetailQuery,
  useUpdateServiceMutation,
} from "../api";
import {
  SERVICE_FEATURE_LIMIT,
  SERVICE_IMAGE_LIMIT,
} from "../constants/ServiceForm.constants";
import { DEFAULT_SERVICE_FORM_VALUES } from "../constants/ServiceFormDefaults.constants";
import type { ServiceDetail } from "../models";
import {
  serviceFormSchema,
  type ServiceFormValues,
} from "../models/ServiceForm.schema";
import type { ServiceFormViewModel } from "../models/ServiceFormViewModel.interface";

export interface UseServiceFormViewModelOptions {
  readonly businessStatus?: BusinessStatus;
  readonly initialService?: ServiceDetail;
  readonly onCancel?: () => void;
  readonly onSuccess?: (serviceId: string) => void;
  readonly serviceId?: string;
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
  const updateServiceMutation = useUpdateServiceMutation();

  const isEditMode = Boolean(options.serviceId);

  const [imageError, setImageError] = useState<Nullable<string>>(null);

  const businessStatusQuery = useQuery<BusinessStatus>({
    enabled: options.businessStatus === undefined,
    queryFn: () => fetchBusinessStatus(businessId),
    queryKey: [FIRESTORE_COLLECTION.BUSINESSES, businessId, "status"],
  });

  const serviceDetailQuery = useServiceDetailQuery({
    businessId,
    enabled: isEditMode && !options.initialService,
    serviceId: options.serviceId ?? null,
  });

  const effectiveBusinessStatus =
    options.businessStatus ??
    businessStatusQuery.data ??
    BUSINESS_STATUS.ACTIVE;

  const isReadOnly = effectiveBusinessStatus !== BUSINESS_STATUS.ACTIVE;

  const effectiveServiceDetail =
    options.initialService ?? serviceDetailQuery.data;

  const initialValues: ServiceFormValues = options.initialService
    ? {
        description: options.initialService.description ?? STRING.EMPTY,
        durationMinutes: options.initialService.durationMinutes,
        features: [...options.initialService.features],
        imageUrl: options.initialService.imageUrl ?? null,
        name: options.initialService.name,
        price: options.initialService.priceInCents / MONEY.CENTS_PER_UNIT,
      }
    : DEFAULT_SERVICE_FORM_VALUES;

  const form = useForm<ServiceFormValues>({
    defaultValues: initialValues,
    mode: "onBlur",
    resolver: zodResolver(serviceFormSchema) as Resolver<ServiceFormValues>,
  });

  useEffect(() => {
    if (effectiveServiceDetail) {
      form.reset({
        description: effectiveServiceDetail.description ?? STRING.EMPTY,
        durationMinutes: effectiveServiceDetail.durationMinutes,
        features: [...effectiveServiceDetail.features],
        imageUrl: effectiveServiceDetail.imageUrl ?? null,
        name: effectiveServiceDetail.name,
        price: effectiveServiceDetail.priceInCents / MONEY.CENTS_PER_UNIT,
      });
    }
  }, [effectiveServiceDetail, form]);

  const currentFeatures =
    useWatch({
      control: form.control,
      name: "features",
    }) ?? [];

  const currentImageUrl = useWatch({
    control: form.control,
    name: "imageUrl",
  });

  const selectedImagePreview: Nullable<string> = currentImageUrl ?? null;

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
    form.setValue("imageUrl", objectUrl, { shouldDirty: true });
  };

  const handleRemoveImage = (): void => {
    setImageError(null);
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

    if (isEditMode && options.serviceId) {
      updateServiceMutation.mutate(
        {
          businessId,
          formValues: {
            ...formValues,
            features: sanitizedFeatures,
          },
          serviceId: options.serviceId,
        },
        {
          onError: (mutationError) => {
            toast.error(t(`common:${mutationError.messageKey}`));
          },
          onSuccess: () => {
            toast.success(t("business:services.form.editSuccess"));
            options.onSuccess?.(options.serviceId!);
          },
        },
      );
      return;
    }

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
    isEditMode,
    isLoading:
      isEditMode && !options.initialService && serviceDetailQuery.isPending,
    isReadOnly,
    isSubmitting:
      createServiceMutation.isPending || updateServiceMutation.isPending,
    selectedImagePreview,
  };
};
