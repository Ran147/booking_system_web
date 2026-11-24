import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { SelectFieldOption } from "@/components/common";
import { I18N_NAMESPACE, STRING } from "@/constants";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { useActiveServicesQuery, useCreateBookingMutation } from "../api";
import { SCHEDULE_BOOKING_ERROR_CODE, SCHEDULE_CONSTANTS } from "../constants";
import type { ActiveServiceOption, CreateBookingFormData } from "../models";

export interface BookingFormViewModelResult {
  readonly closeForm: () => void;
  readonly errorMessage: Nullable<string>;
  readonly formData: CreateBookingFormData;
  readonly handleCustomerChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleDateChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleNotesChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  readonly handleServiceChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  readonly handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly handleTimeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly isCreating: boolean;
  readonly notesValue: string;
  readonly resetForm: () => void;
  readonly serviceOptions: readonly SelectFieldOption[];
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
  new Intl.DateTimeFormat(SCHEDULE_CONSTANTS.ISO_DATE_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    timeZone: SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
    year: "numeric",
  }).format(new Date());

const createInitialFormData = (): CreateBookingFormData => ({
  collaboratorId: null,
  customerId: STRING.EMPTY,
  date: getTodayIso(),
  notes: STRING.EMPTY,
  serviceId: STRING.EMPTY,
  time: SCHEDULE_CONSTANTS.DEFAULT_BOOKING_TIME,
});

export const useBookingFormViewModel = ({
  onClose,
  onSuccess,
}: UseBookingFormViewModelOptions): BookingFormViewModelResult => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.VALIDATION,
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

    if (
      !formData.serviceId ||
      !formData.customerId.trim() ||
      !formData.date ||
      !formData.time
    ) {
      setErrorMessage(t("validation:required"));
      return false;
    }

    const localDate = new Date(
      `${formData.date}T${formData.time}${SCHEDULE_CONSTANTS.SECONDS_SUFFIX}`,
    );
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
      onSuccess?.();
      return true;
    } catch (error: unknown) {
      const errorMessageText =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : STRING.EMPTY;

      if (
        errorMessageText.includes(SCHEDULE_BOOKING_ERROR_CODE.CUSTOMER_BLOCKED)
      ) {
        setErrorMessage(t("schedule.bookings.customerBlockedError"));
      } else if (
        errorMessageText.includes(SCHEDULE_BOOKING_ERROR_CODE.SLOT_TAKEN)
      ) {
        setErrorMessage(t("schedule.bookings.slotTakenError"));
      } else if (
        errorMessageText.includes(
          SCHEDULE_BOOKING_ERROR_CODE.SERVICE_UNAVAILABLE,
        ) ||
        errorMessageText.includes(
          SCHEDULE_BOOKING_ERROR_CODE.BUSINESS_UNAVAILABLE,
        ) ||
        errorMessageText.includes(SCHEDULE_BOOKING_ERROR_CODE.SLOT_IN_PAST)
      ) {
        setErrorMessage(t("schedule.bookings.slotUnavailableError"));
      } else {
        setErrorMessage(t("common:errors.network"));
      }
      return false;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submitForm();
  };

  const handleServiceChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    updateField("serviceId", event.target.value);
  };

  const handleCustomerChange = (event: ChangeEvent<HTMLInputElement>): void => {
    updateField("customerId", event.target.value);
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>): void => {
    updateField("date", event.target.value);
  };

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    updateField("time", event.target.value);
  };

  const handleNotesChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    updateField("notes", event.target.value);
  };

  const serviceOptions: readonly SelectFieldOption[] = (
    servicesQuery.data ?? []
  ).map((service: ActiveServiceOption) => ({
    label: `${service.name} (${t("schedule.bookings.durationMinutes", { minutes: service.durationMinutes })})`,
    value: service.id,
  }));

  return {
    closeForm,
    errorMessage,
    formData,
    handleCustomerChange,
    handleDateChange,
    handleNotesChange,
    handleServiceChange,
    handleSubmit,
    handleTimeChange,
    isCreating: createBookingMutation.isPending,
    notesValue: formData.notes ?? STRING.EMPTY,
    resetForm,
    serviceOptions,
    submitForm,
    updateField,
  };
};
