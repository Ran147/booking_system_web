import type { IncomingMessage, ServerResponse } from "node:http";
import handler from "../../api/callFunction";

export interface FunctionResult {
  readonly body: Record<string, unknown>;
  readonly statusCode: number;
}

// Calls the Vercel handler the way src/services/firebase/callFunction.ts
// does, optionally with an ID token in the Authorization header.
export const callApiFunction = async (
  functionName: string,
  payload: Record<string, unknown>,
  idToken?: string,
): Promise<FunctionResult> => {
  let statusCode = 0;
  let responseContent = "";
  const request = {
    body: { functionName, payload },
    headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
    method: "POST",
  } as unknown as IncomingMessage;
  const response = {
    end: (content?: string): void => {
      responseContent = content ?? "";
    },
    setHeader: (): void => undefined,
    set statusCode(code: number) {
      statusCode = code;
    },
  } as unknown as ServerResponse;

  await handler(request, response);
  return {
    body: JSON.parse(responseContent) as Record<string, unknown>,
    statusCode,
  };
};
