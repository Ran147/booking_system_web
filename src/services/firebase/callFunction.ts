import { httpsCallable } from "firebase/functions";
import type { FunctionName } from "@/shared/constants";
import { executeClientFunctionsFallback } from "./clientFunctionsFallback";
import { functions } from "./firebaseApp";

export const callFunction = async <Payload, Response>(
  functionName: FunctionName,
  payload: Payload,
): Promise<Response> => {
  try {
    const callable = httpsCallable<Payload, Response>(functions, functionName);
    const callableResult = await callable(payload);
    return callableResult.data;
  } catch (error) {
    if (import.meta.env.DEV && !import.meta.env.VITEST) {
      try {
        const devResponse = await fetch("/__api/callFunction", {
          body: JSON.stringify({ functionName, payload }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (devResponse.ok) {
          return (await devResponse.json()) as Response;
        }
      } catch {
        // Dev bridge fetch failed, proceed to client fallback
      }
    }

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

    throw error;
  }
};
