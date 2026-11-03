import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type {
  UpdateServicePayload,
  UpdateServiceResponse,
} from "../models/UpdateService.mutation";

export const updateService = async (
  payload: UpdateServicePayload,
): Promise<UpdateServiceResponse> =>
  await callFunction<UpdateServicePayload, UpdateServiceResponse>(
    FUNCTION_NAME.UPDATE_SERVICE,
    payload,
  );
