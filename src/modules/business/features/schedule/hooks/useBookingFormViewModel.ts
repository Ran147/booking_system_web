import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { useActiveServicesQuery, useCreateBookingMutation } from "../api";
import { SCHEDULE_CONSTANTS } from "../constants";
import type { ActiveServiceOption, CreateBookingFormData } from "../models";

export interface BookingFormViewModelResult {
  readonly closeForm: () => void;
  readonly errorMessage: Nullable<string>;
  readonly formData: CreateBookingFormData;
  readonly isCreating: boolean;
  readonly resetForm: () => void;
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

const getTodayIso = (): string =>
  new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
    year: "numeric",
  }).format(new Date());

const createInitialFormData = (): CreateBookingFormData => ({
  collaboratorId: null,
  customerId: "",
  date: getTodayIso(),
  notes: "",
  serviceId: "",
  time: "10:00",
});

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

  const [formData, setFormData] = useState<CreateBookingFormData>(
    createInitialFormData(),
  );
  const [errorMessage, setErrorMessage] = useState<Nullable<string>>(null);

  const updateField = <Key extends keyof CreateBookingFormData>(
    field: Key,
    value: CreateBookingFormData[Key],
  ): void => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = (): void => {
    setFormData(createInitialFormData());
    setErrorMessage(null);
  };

  const closeForm = (): void => {
    resetForm();
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

    const localDate = new Date(`${formData.date}T${formData.time}:00`);
    const startsAtIso = localDate.toISOString();

    try {
      await createBookingMutation.mutateAsync({
        businessId,
        collaboratorId: formData.collaboratorId || null,
        customerId: formData.customerId.trim(),
        notes: formData.notes || null,
        serviceId: formData.serviceId,
        startsAt: startsAtIso,
      });

      resetForm();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
      return true;
    } catch (error: unknown) {
      const errorMessageText =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "";

      if (errorMessageText.includes("customer_blocked")) {
        setErrorMessage(t("schedule.bookings.customerBlockedError"));
      } else if (errorMessageText.includes("slot_taken")) {
        setErrorMessage(t("schedule.bookings.slotTakenError"));
      } else if (
        errorMessageText.includes("service_unavailable") ||
        errorMessageText.includes("business_unavailable") ||
        errorMessageText.includes("slot_in_past")
      ) {
        setErrorMessage(t("schedule.bookings.slotUnavailableError"));
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
    resetForm,
    serviceOptions,
    submitForm,
    updateField,
  };
};
