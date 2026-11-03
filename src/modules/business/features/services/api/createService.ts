import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type {
  CreateServicePayload,
  CreateServiceResponse,
} from "../models/CreateService.mutation";

export const createService = async (
  payload: CreateServicePayload,
): Promise<CreateServiceResponse> =>
  await callFunction<CreateServicePayload, CreateServiceResponse>(
    FUNCTION_NAME.CREATE_SERVICE,
    payload,
  );
