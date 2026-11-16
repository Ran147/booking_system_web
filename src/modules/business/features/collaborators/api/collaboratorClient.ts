import { FirebaseError } from "firebase/app";
import {
  ERROR_MESSAGE_KEY,
  FIREBASE_ERROR_CODE,
  FUNCTION_NAME,
} from "@/constants";
import type { CollaboratorPermission } from "@/domain";
import { callFunction, mapFirebaseError } from "@/services/firebase";
import type { Nullable } from "@/types";
import { COLLABORATOR_ERROR_REASON } from "../constants/CollaboratorFeature.constants";

export interface RegisterCollaboratorPayload {
  readonly businessId: string;
  readonly email: string;
  readonly fullName: string;
  readonly permissions: readonly CollaboratorPermission[];
  readonly phone: string;
  readonly serviceIds: readonly string[];
  readonly specialty: Nullable<string>;
}

export interface RegisterCollaboratorResponse {
  readonly collaboratorId: string;
  readonly email: string;
  readonly invitationToken?: Nullable<string>;
  readonly status: string;
}

export interface UpdateCollaboratorPayload {
  readonly businessId: string;
  readonly collaboratorId: string;
  readonly email?: string;
  readonly expectedUpdatedAt?: string;
  readonly fullName: string;
  readonly phone: string;
  readonly serviceIds: readonly string[];
  readonly specialty: Nullable<string>;
}

export interface UpdateCollaboratorResponse {
  readonly collaboratorId: string;
  readonly emailChanged: boolean;
  readonly invitationToken?: Nullable<string>;
  readonly upcomingAffectedBookingsCount: number;
}

export interface UpdateCollaboratorStatusPayload {
  readonly businessId: string;
  readonly collaboratorId: string;
  readonly targetStatus: string;
}

export interface UpdateCollaboratorStatusResponse {
  readonly collaboratorId: string;
  readonly status: string;
}

export interface UpdateCollaboratorPermissionsPayload {
  readonly businessId: string;
  readonly collaboratorId: string;
  readonly permissions: readonly CollaboratorPermission[];
}

export interface UpdateCollaboratorPermissionsResponse {
  readonly collaboratorId: string;
  readonly permissions: readonly CollaboratorPermission[];
}

export interface ResendCollaboratorEmailPayload {
  readonly businessId: string;
  readonly collaboratorId: string;
}

export interface ResendCollaboratorEmailResponse {
  readonly collaboratorId: string;
  readonly invitationToken?: Nullable<string>;
  readonly kind: string;
}

export interface CollaboratorMutationError {
  readonly hasHigherPlan?: boolean;
  readonly limit?: Nullable<number>;
  readonly messageKey: string;
  readonly reason: Nullable<string>;
  readonly retryAfterSeconds?: number;
}

const readErrorDetails = (error: unknown): Record<string, unknown> => {
  if (
    error instanceof FirebaseError &&
    "details" in error &&
    typeof (error as { details?: unknown }).details === "object" &&
    (error as { details?: unknown }).details !== null
  ) {
    return (error as { details: Record<string, unknown> }).details;
  }
  return {};
};

export const mapCollaboratorMutationError = (
  error: unknown,
): CollaboratorMutationError => {
  const details = readErrorDetails(error);
  const reason = typeof details.reason === "string" ? details.reason : null;

  if (reason === COLLABORATOR_ERROR_REASON.LIMIT_REACHED) {
    return {
      hasHigherPlan: Boolean(details.hasHigherPlan),
      limit: typeof details.limit === "number" ? details.limit : null,
      messageKey: "business:collaborators.limit.reached",
      reason,
    };
  }

  if (reason === COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE) {
    return {
      messageKey: "business:collaborators.create.emailInUse",
      reason,
    };
  }

  if (reason === COLLABORATOR_ERROR_REASON.CONCURRENT_MODIFICATION) {
    return {
      messageKey: "business:collaborators.edit.concurrentError",
      reason,
    };
  }

  if (reason === COLLABORATOR_ERROR_REASON.COOLDOWN_ACTIVE) {
    return {
      messageKey: "business:collaborators.resend.cooldownError",
      reason,
      retryAfterSeconds:
        typeof details.retryAfterSeconds === "number"
          ? details.retryAfterSeconds
          : undefined,
    };
  }

  if (reason === COLLABORATOR_ERROR_REASON.EMAIL_DISPATCH_FAILED) {
    return {
      messageKey: "business:collaborators.resend.dispatchError",
      reason,
    };
  }

  if (reason === COLLABORATOR_ERROR_REASON.BUSINESS_NOT_ACTIVE) {
    return {
      messageKey: "business:collaborators.list.readOnly",
      reason,
    };
  }

  if (
    error instanceof FirebaseError &&
    error.code === FIREBASE_ERROR_CODE.FUNCTIONS_ALREADY_EXISTS
  ) {
    return {
      messageKey: "business:collaborators.create.emailInUse",
      reason: COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE,
    };
  }

  const mapped = mapFirebaseError(error);
  return {
    messageKey: `common:${mapped.messageKey || ERROR_MESSAGE_KEY.UNKNOWN}`,
    reason,
  };
};

export const registerCollaborator = async (
  payload: RegisterCollaboratorPayload,
): Promise<RegisterCollaboratorResponse> =>
  callFunction<RegisterCollaboratorPayload, RegisterCollaboratorResponse>(
    FUNCTION_NAME.REGISTER_COLLABORATOR,
    payload,
  );

export const updateCollaborator = async (
  payload: UpdateCollaboratorPayload,
): Promise<UpdateCollaboratorResponse> =>
  callFunction<UpdateCollaboratorPayload, UpdateCollaboratorResponse>(
    FUNCTION_NAME.UPDATE_COLLABORATOR,
    payload,
  );

export const updateCollaboratorStatus = async (
  payload: UpdateCollaboratorStatusPayload,
): Promise<UpdateCollaboratorStatusResponse> =>
  callFunction<
    UpdateCollaboratorStatusPayload,
    UpdateCollaboratorStatusResponse
  >(FUNCTION_NAME.UPDATE_COLLABORATOR_STATUS, payload);

export const updateCollaboratorPermissions = async (
  payload: UpdateCollaboratorPermissionsPayload,
): Promise<UpdateCollaboratorPermissionsResponse> =>
  callFunction<
    UpdateCollaboratorPermissionsPayload,
    UpdateCollaboratorPermissionsResponse
  >(FUNCTION_NAME.UPDATE_COLLABORATOR_PERMISSIONS, payload);

export const resendCollaboratorEmail = async (
  payload: ResendCollaboratorEmailPayload,
): Promise<ResendCollaboratorEmailResponse> =>
  callFunction<ResendCollaboratorEmailPayload, ResendCollaboratorEmailResponse>(
    FUNCTION_NAME.RESEND_COLLABORATOR_EMAIL,
    payload,
  );
