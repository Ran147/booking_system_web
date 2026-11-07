import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { useActiveServicesQuery, useCreateBookingMutation } from "../api";
import type { ActiveServiceOption, CreateBookingFormData } from "../models";

export interface BookingFormViewModelResult {
  readonly closeForm: () => void;
  readonly errorMessage: Nullable<string>;
  readonly formData: CreateBookingFormData;
  readonly isCreating: boolean;
  readonly serviceOptions: readonly { label: string; value: string }[];
  readonly submitForm: () => Promise<boolean>;
  readonly updateField: <Key extends keyof CreateBookingFormData>(
    field: Key,
    value: CreateBookingFormData[Key],
  ) => void;
}

interface UseBookingFormViewModelOptions {
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const getTodayIso = (): string => new Date().toISOString().split("T")[0] ?? "";

export const useBookingFormViewModel = ({
  onClose,
  onSuccess,
}: UseBookingFormViewModelOptions): BookingFormViewModelResult => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    "validation",
    I18N_NAMESPACE.COMMON,
  ]);
  const { businessId } = useCurrentBusiness();

  const servicesQuery = useActiveServicesQuery(businessId);
  const createBookingMutation = useCreateBookingMutation();

  const [formData, setFormData] = useState<CreateBookingFormData>({
    collaboratorId: null,
    customerId: "",
    date: getTodayIso(),
    notes: "",
    serviceId: "",
    time: "10:00",
  });
  const [errorMessage, setErrorMessage] = useState<Nullable<string>>(null);

  const updateField = <Key extends keyof CreateBookingFormData>(
    field: Key,
    value: CreateBookingFormData[Key],
  ): void => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const closeForm = (): void => {
    setErrorMessage(null);
    onClose();
  };

  const submitForm = async (): Promise<boolean> => {
    setErrorMessage(null);

    if (!formData.serviceId) {
      setErrorMessage(
        t("validation:required", { defaultValue: "Campo requerido" }),
      );
      return false;
    }
    if (!formData.customerId.trim()) {
      setErrorMessage(
        t("validation:required", { defaultValue: "Campo requerido" }),
      );
      return false;
    }
    if (!formData.date || !formData.time) {
      setErrorMessage(
        t("validation:required", { defaultValue: "Campo requerido" }),
      );
      return false;
    }

    const startsAtIso = `${formData.date}T${formData.time}:00`;

    try {
      await createBookingMutation.mutateAsync({
        businessId,
        collaboratorId: formData.collaboratorId || null,
        customerId: formData.customerId.trim(),
        notes: formData.notes || null,
        serviceId: formData.serviceId,
        startsAt: startsAtIso,
      });

      closeForm();
      if (onSuccess) {
        onSuccess();
      }
      return true;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        String(error.message).includes("customer_blocked")
      ) {
        setErrorMessage(t("schedule.bookings.customerBlockedError"));
      } else {
        setErrorMessage(
          t("errors.common.network", { defaultValue: "Error de red" }),
        );
      }
      return false;
    }
  };

  const serviceOptions = (servicesQuery.data ?? []).map(
    (service: ActiveServiceOption) => ({
      label: `${service.name} (${service.durationMinutes} min)`,
      value: service.id,
    }),
  );

  return {
    closeForm,
    errorMessage,
    formData,
    isCreating: createBookingMutation.isPending,
    serviceOptions,
    submitForm,
    updateField,
  };
};
