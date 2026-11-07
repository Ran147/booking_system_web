import type { IncomingMessage, ServerResponse } from "node:http";
import handler from "../../api/callFunction";

export interface FunctionResult {
  readonly body: Record<string, unknown>;
  readonly statusCode: number;
}

export const callServerFunction = async (
  functionName: string,
  payload: Record<string, unknown>,
): Promise<FunctionResult> => {
  let statusCode = 0;
  let responseContent = "";
  const request = {
    body: { functionName, payload },
    method: "POST",
  } as unknown as IncomingMessage;

  const response = {
    end: (content?: string): void => {
      responseContent = content ?? "";
    },
    setHeader: (): void => {},
    statusCode: 0,
  } as unknown as ServerResponse;

  Object.defineProperty(response, "statusCode", {
    get: (): number => statusCode,
    set: (value: number): void => {
      statusCode = value;
    },
  });

  await handler(request, response);

  return {
    body: responseContent
      ? (JSON.parse(responseContent) as Record<string, unknown>)
      : {},
    statusCode,
  };
};
