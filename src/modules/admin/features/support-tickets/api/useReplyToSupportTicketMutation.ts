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
  ReplyToSupportTicketInput,
  ReplyToSupportTicketOutput,
} from "../models";
import { supportTicketsQueryKeys } from "./supportTicketsQueryKeys";

export const useReplyToSupportTicketMutation = (): UseMutationResult<
  ReplyToSupportTicketOutput,
  Error,
  ReplyToSupportTicketInput
> => {
  const queryClient = useQueryClient();
  const { t } = useTranslation(I18N_NAMESPACE.ADMIN);

  return useMutation<
    ReplyToSupportTicketOutput,
    Error,
    ReplyToSupportTicketInput
  >({
    mutationFn: async (
      input: ReplyToSupportTicketInput,
    ): Promise<ReplyToSupportTicketOutput> =>
      callFunction<ReplyToSupportTicketInput, ReplyToSupportTicketOutput>(
        FUNCTION_NAME.REPLY_TO_SUPPORT_TICKET,
        input,
      ),
    onError: (error: Error): void => {
      toast.error(error.message || t("supportTickets.reply.errorToast"));
    },
    onSuccess: (): void => {
      toast.success(t("supportTickets.reply.successToast"));
      void queryClient.invalidateQueries({
        queryKey: supportTicketsQueryKeys.all,
      });
    },
  });
};
