import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BUSINESS_STATUS } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import { mapFirebaseError } from "@/services/firebase";
import type { NullableUndefined } from "@/types";
import {
  fetchReminderSettings,
  reminderSettingsQueryKey,
  saveReminderSettings,
} from "../api/reminderSettingsApi";
import {
  MAX_REMINDER_LEAD_TIMES,
  reminderSettingsSchema,
  type ReminderLeadTime,
  type ReminderSettings,
  type ReminderSettingsDocument,
} from "../models/ReminderSettings.schema";

interface ReminderSettingsViewModel {
  errorMessage: NullableUndefined<string>;
  isDirty: boolean;
  isError: boolean;
  isLoading: boolean;
  isReadOnly: boolean;
  isSaving: boolean;
  save: () => void;
  settings: NullableUndefined<ReminderSettings>;
  timeZone: NullableUndefined<string>;
  toggleEnabled: (checked: boolean) => void;
  toggleLeadTime: (leadTime: ReminderLeadTime) => void;
}

export const useReminderSettingsViewModel = (): ReminderSettingsViewModel => {
  const { businessId } = useCurrentBusiness();
  const queryClient = useQueryClient();
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.VALIDATION,
  ]);
  const queryKey = reminderSettingsQueryKey(businessId);
  const query = useQuery({
    queryFn: () => fetchReminderSettings(businessId),
    queryKey,
  });
  const [editedSettings, setEditedSettings] =
    useState<NullableUndefined<ReminderSettings>>();
  const [errorMessage, setErrorMessage] = useState<NullableUndefined<string>>();
  const settings = editedSettings ?? query.data?.reminderSettings;
  const mutation = useMutation<void, unknown, ReminderSettings>({
    mutationFn: (nextSettings) =>
      saveReminderSettings(businessId, nextSettings),
    onError: (error) => {
      const mapped = mapFirebaseError(error);
      const message = t(`common:${mapped.messageKey}`);
      setErrorMessage(message);
      toast.error(message);
    },
    onSuccess: async (_result, savedSettings) => {
      setErrorMessage(undefined);
      queryClient.setQueryData<ReminderSettingsDocument>(queryKey, (current) =>
        current ? { ...current, reminderSettings: savedSettings } : current,
      );
      setEditedSettings(undefined);
      toast.success(t("business:notificationSettings.reminders.saved"));
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  const isReadOnly = query.data?.status !== BUSINESS_STATUS.ACTIVE;
  const isDirty = Boolean(
    settings &&
    query.data &&
    JSON.stringify(settings) !== JSON.stringify(query.data.reminderSettings),
  );
  const toggleLeadTime = (leadTime: ReminderLeadTime): void => {
    if (!settings || isReadOnly || mutation.isPending) return;
    const selected = settings.leadTimesMinutes.includes(leadTime);
    if (
      !selected &&
      settings.leadTimesMinutes.length >= MAX_REMINDER_LEAD_TIMES
    ) {
      setErrorMessage(
        t("business:notificationSettings.reminders.maximumError"),
      );
      return;
    }
    setErrorMessage(undefined);
    setEditedSettings({
      ...settings,
      leadTimesMinutes: selected
        ? settings.leadTimesMinutes.filter((value) => value !== leadTime)
        : [...settings.leadTimesMinutes, leadTime],
    });
  };
  const save = (): void => {
    if (!settings || isReadOnly || !isDirty) return;
    if (!reminderSettingsSchema.safeParse(settings).success) {
      setErrorMessage(t("validation:required"));
      return;
    }
    mutation.mutate(settings);
  };
  return {
    errorMessage,
    isDirty,
    isError: query.isError,
    isLoading: query.isLoading,
    isReadOnly,
    isSaving: mutation.isPending,
    save,
    settings,
    timeZone: query.data?.timeZone,
    toggleEnabled: (checked) =>
      settings && setEditedSettings({ ...settings, isEnabled: checked }),
    toggleLeadTime,
  };
};
