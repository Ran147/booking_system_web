import { httpsCallable } from "firebase/functions";
import type { FunctionName } from "@/shared/constants";
import { functions } from "./firebaseApp";

export const callFunction = async <Payload, Response>(
  functionName: FunctionName,
  payload: Payload,
): Promise<Response> => {
  const callable = httpsCallable<Payload, Response>(functions, functionName);
  const callableResult = await callable(payload);
  return callableResult.data;
};
