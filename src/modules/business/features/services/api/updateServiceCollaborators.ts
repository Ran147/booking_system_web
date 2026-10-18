import { FUNCTION_NAME } from "@/constants";
import { callFunction, mapFirebaseError } from "@/services/firebase";
import type {
  UpdateServiceCollaboratorsPayload,
  UpdateServiceCollaboratorsResponse,
} from "../models/UpdateServiceCollaborators.mutation";

export const updateServiceCollaborators = async (
  payload: UpdateServiceCollaboratorsPayload,
): Promise<UpdateServiceCollaboratorsResponse> => {
  try {
    return await callFunction<
      UpdateServiceCollaboratorsPayload,
      UpdateServiceCollaboratorsResponse
    >(FUNCTION_NAME.UPDATE_SERVICE_COLLABORATORS, payload);
  } catch (error) {
    throw mapFirebaseError(error);
  }
};
