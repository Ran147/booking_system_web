import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type {
  ValidateCollaboratorInvitationPayload,
  ValidateCollaboratorInvitationResponse,
} from "../models/AcceptInvitation.mutation";

export const validateCollaboratorInvitation = (
  payload: ValidateCollaboratorInvitationPayload,
): Promise<ValidateCollaboratorInvitationResponse> =>
  callFunction<
    ValidateCollaboratorInvitationPayload,
    ValidateCollaboratorInvitationResponse
  >(FUNCTION_NAME.VALIDATE_COLLABORATOR_INVITATION, payload);
