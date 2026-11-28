import type { AcceptInvitationErrorKey } from "../constants/AcceptInvitation.constants";

export interface ValidateCollaboratorInvitationPayload {
  readonly invitationToken: string;
}

export interface ValidateCollaboratorInvitationResponse {
  readonly businessName: string;
  readonly email: string;
}

export interface AcceptCollaboratorInvitationPayload {
  readonly invitationToken: string;
  readonly password: string;
  readonly recaptchaToken: string;
}

export interface AcceptCollaboratorInvitationResponse {
  readonly email: string;
}

export interface AcceptInvitationError {
  readonly code: string;
  readonly messageKey: AcceptInvitationErrorKey;
}
