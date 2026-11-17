import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { Nullable } from "@/types";
import {
  acceptCollaboratorInvitation,
  mapAcceptInvitationError,
  validateCollaboratorInvitation,
} from "./invitationClient";
import type {
  AcceptInvitationError,
  AcceptInvitationPayload,
  AcceptInvitationResponse,
  ValidateInvitationResponse,
} from "../models/acceptInvitation.model";

const invitationQueryKeys = {
  validation: (token: Nullable<string>) =>
    ["auth", "collaborator-invitation", token] as const,
};

export const useValidateInvitationQuery = (
  invitationToken: Nullable<string>,
): UseQueryResult<ValidateInvitationResponse, AcceptInvitationError> =>
  useQuery({
    enabled: Boolean(invitationToken),
    queryFn: async (): Promise<ValidateInvitationResponse> => {
      try {
        return await validateCollaboratorInvitation(invitationToken ?? "");
      } catch (error) {
        throw mapAcceptInvitationError(error);
      }
    },
    queryKey: invitationQueryKeys.validation(invitationToken),
    retry: false,
  });

export const useAcceptInvitationMutation = (): UseMutationResult<
  AcceptInvitationResponse,
  AcceptInvitationError,
  AcceptInvitationPayload
> =>
  useMutation({
    mutationFn: async (
      payload: AcceptInvitationPayload,
    ): Promise<AcceptInvitationResponse> => {
      try {
        return await acceptCollaboratorInvitation(payload);
      } catch (error) {
        throw mapAcceptInvitationError(error);
      }
    },
  });
