import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type {
  AcceptCollaboratorInvitationPayload,
  AcceptCollaboratorInvitationResponse,
} from "../models/AcceptInvitation.mutation";

export const acceptCollaboratorInvitation = (
  payload: AcceptCollaboratorInvitationPayload,
): Promise<AcceptCollaboratorInvitationResponse> =>
  callFunction<
    AcceptCollaboratorInvitationPayload,
    AcceptCollaboratorInvitationResponse
  >(FUNCTION_NAME.ACCEPT_COLLABORATOR_INVITATION, payload);
