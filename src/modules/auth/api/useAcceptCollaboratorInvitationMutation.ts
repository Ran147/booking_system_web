import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { acceptCollaboratorInvitation } from "./acceptCollaboratorInvitation";
import { mapAcceptInvitationError } from "./mapAcceptInvitationError";
import type {
  AcceptCollaboratorInvitationPayload,
  AcceptCollaboratorInvitationResponse,
  AcceptInvitationError,
} from "../models/AcceptInvitation.mutation";

export const useAcceptCollaboratorInvitationMutation = (): UseMutationResult<
  AcceptCollaboratorInvitationResponse,
  AcceptInvitationError,
  AcceptCollaboratorInvitationPayload
> =>
  useMutation<
    AcceptCollaboratorInvitationResponse,
    AcceptInvitationError,
    AcceptCollaboratorInvitationPayload
  >({
    mutationFn: async (payload) => {
      try {
        return await acceptCollaboratorInvitation(payload);
      } catch (error) {
        throw mapAcceptInvitationError(error);
      }
    },
  });
