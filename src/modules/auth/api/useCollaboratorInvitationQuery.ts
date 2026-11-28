import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { STRING } from "@/constants";
import type { Nullable } from "@/types";
import { mapAcceptInvitationError } from "./mapAcceptInvitationError";
import { validateCollaboratorInvitation } from "./validateCollaboratorInvitation";
import type {
  AcceptInvitationError,
  ValidateCollaboratorInvitationResponse,
} from "../models/AcceptInvitation.mutation";

export const useCollaboratorInvitationQuery = (
  invitationToken: Nullable<string>,
): UseQueryResult<
  ValidateCollaboratorInvitationResponse,
  AcceptInvitationError
> =>
  useQuery<ValidateCollaboratorInvitationResponse, AcceptInvitationError>({
    enabled: invitationToken !== null && invitationToken.trim().length > 0,
    queryFn: async () => {
      try {
        return await validateCollaboratorInvitation({
          invitationToken: invitationToken ?? STRING.EMPTY,
        });
      } catch (error) {
        throw mapAcceptInvitationError(error);
      }
    },
    queryKey: ["auth", "collaborator-invitation", invitationToken],
    retry: false,
  });
