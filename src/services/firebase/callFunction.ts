import { FirebaseError } from "firebase/app";
import {
  FunctionsError,
  httpsCallable,
  type FunctionsErrorCodeCore,
} from "firebase/functions";
import { HTTP_STATUS, type FunctionName } from "@/constants";
import { executeClientFunctionsFallback } from "./clientFunctionsFallback";
import { functions } from "./firebaseApp";

interface CallFunctionErrorPayload {
  readonly code?: string;
  readonly details?: unknown;
  readonly error?: string;
  readonly message?: string;
}

export const callFunction = async <Payload, Response>(
  functionName: FunctionName,
  payload: Payload,
): Promise<Response> => {
  if (!import.meta.env.VITEST) {
    try {
      const serverResponse = await fetch("/api/callFunction", {
        body: JSON.stringify({ functionName, payload }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (serverResponse.ok) {
        return (await serverResponse.json()) as Response;
      }

      if (
        serverResponse.status >= HTTP_STATUS.BAD_REQUEST &&
        serverResponse.status < HTTP_STATUS.INTERNAL_SERVER_ERROR
      ) {
        const errorJson =
          (await serverResponse.json()) as CallFunctionErrorPayload;
        const rawCode = (
          errorJson.code ||
          errorJson.error ||
          "internal"
        ).replace("functions/", "") as FunctionsErrorCodeCore;
        const errorMessage = errorJson.message || "Function call failed";
        throw new FunctionsError(rawCode, errorMessage, errorJson.details);
      }
    } catch (apiError) {
      if (apiError instanceof FirebaseError) {
        throw apiError;
      }
    }
  }

  try {
    const callable = httpsCallable<Payload, Response>(functions, functionName);
    const callableResult = await callable(payload);
    return callableResult.data;
  } catch (cloudFunctionsError) {
    if (!import.meta.env.VITEST) {
      try {
        return await executeClientFunctionsFallback<Payload, Response>(
          functionName,
          payload,
        );
      } catch {
        // Fallback failed, throw original error
      }
    }

    throw cloudFunctionsError;
  }
};
