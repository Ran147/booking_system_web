import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/common";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase/callFunction";
import { I18N_NAMESPACE } from "@/shared/constants";
import type {
  ResolveSupportTicketInput,
  ResolveSupportTicketOutput,
} from "../models";
import { supportTicketsQueryKeys } from "./supportTicketsQueryKeys";

export const useResolveSupportTicketMutation = (): UseMutationResult<
  ResolveSupportTicketOutput,
  Error,
  ResolveSupportTicketInput
> => {
  const queryClient = useQueryClient();
  const { t } = useTranslation(I18N_NAMESPACE.ADMIN);

  return useMutation<
    ResolveSupportTicketOutput,
    Error,
    ResolveSupportTicketInput
  >({
    mutationFn: async (
      input: ResolveSupportTicketInput,
    ): Promise<ResolveSupportTicketOutput> =>
      callFunction<ResolveSupportTicketInput, ResolveSupportTicketOutput>(
        FUNCTION_NAME.RESOLVE_SUPPORT_TICKET,
        input,
      ),
    onError: (error: Error): void => {
      toast.error(error.message || t("supportTickets.resolve.errorToast"));
    },
    onSuccess: (): void => {
      toast.success(t("supportTickets.resolve.successToast"));
      void queryClient.invalidateQueries({
        queryKey: supportTicketsQueryKeys.all,
      });
    },
  });
};
