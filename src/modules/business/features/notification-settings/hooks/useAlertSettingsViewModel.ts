import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BUSINESS_STATUS } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import { mapFirebaseError } from "@/services/firebase";
import type { NullableUndefined } from "@/types";
import {
  alertSettingsQueryKey,
  fetchAlertSettings,
  updateAlertSettings,
} from "../api/alertSettingsApi";
import type {
  AlertSettingKey,
  AlertSettings,
  AlertSettingsDocument,
} from "../models/AlertSettings.schema";

interface AlertSettingsViewModel {
  changeSetting: (key: AlertSettingKey, checked: boolean) => void;
  isError: boolean;
  isLoading: boolean;
  isReadOnly: boolean;
  isSaving: boolean;
  settings: NullableUndefined<AlertSettings>;
}

export const useAlertSettingsViewModel = (): AlertSettingsViewModel => {
  const { businessId } = useCurrentBusiness();
  const queryClient = useQueryClient();
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const queryKey = alertSettingsQueryKey(businessId);
  const query = useQuery({
    queryFn: () => fetchAlertSettings(businessId),
    queryKey,
  });
  const mutation = useMutation<
    void,
    unknown,
    AlertSettings,
    NullableUndefined<AlertSettingsDocument>
  >({
    mutationFn: (settings: AlertSettings) =>
      updateAlertSettings(businessId, settings),
    onError: (
      error,
      _settings,
      previous: NullableUndefined<AlertSettingsDocument>,
    ) => {
      if (previous) queryClient.setQueryData(queryKey, previous);
      const mappedError = mapFirebaseError(error);
      toast.error(t(`common:${mappedError.messageKey}`));
    },
    onMutate: async (settings) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<AlertSettingsDocument>(queryKey);
      if (previous)
        queryClient.setQueryData(queryKey, {
          ...previous,
          alertSettings: settings,
        });
      return previous;
    },
    onSettled: async () => queryClient.invalidateQueries({ queryKey }),
  });
  const isReadOnly = query.data?.status !== BUSINESS_STATUS.ACTIVE;
  const changeSetting = (key: AlertSettingKey, checked: boolean): void => {
    if (!query.data || isReadOnly || mutation.isPending) return;
    mutation.mutate({ ...query.data.alertSettings, [key]: checked });
  };
  return {
    changeSetting,
    isError: query.isError,
    isLoading: query.isLoading,
    isReadOnly,
    isSaving: mutation.isPending,
    settings: query.data?.alertSettings,
  };
};
