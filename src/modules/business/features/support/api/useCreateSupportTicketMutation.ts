import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/common";
import { FUNCTION_NAME, I18N_NAMESPACE } from "@/constants";
import { callFunction } from "@/services/firebase/callFunction";
import type {
  CreateSupportTicketPayload,
  CreateSupportTicketResponse,
} from "./CreateSupportTicket.mutation";
import { supportQueryKeys } from "./supportQueryKeys";

export const useCreateSupportTicketMutation = (
  businessId: string,
): UseMutationResult<
  CreateSupportTicketResponse,
  Error,
  CreateSupportTicketPayload
> => {
  const queryClient = useQueryClient();
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  return useMutation<
    CreateSupportTicketResponse,
    Error,
    CreateSupportTicketPayload
  >({
    mutationFn: async (
      payload: CreateSupportTicketPayload,
    ): Promise<CreateSupportTicketResponse> =>
      callFunction<CreateSupportTicketPayload, CreateSupportTicketResponse>(
        FUNCTION_NAME.CREATE_SUPPORT_TICKET,
        payload,
      ),
    onError: (): void => {
      toast.error(t("common:errors.network"));
    },
    onSuccess: (): void => {
      toast.success(t("business:support.create.success"));
      void queryClient.invalidateQueries({
        queryKey: supportQueryKeys.all(businessId),
      });
    },
  });
};
