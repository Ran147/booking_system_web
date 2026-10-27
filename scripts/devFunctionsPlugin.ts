import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, PreviewServer, ViteDevServer } from "vite";
import handler from "../api/callFunction";
import { HTTP_METHOD } from "../src/constants/common/HttpMethod.constants";

const attachMiddlewares = (
  middlewares: PreviewServer["middlewares"] | ViteDevServer["middlewares"],
): void => {
  const handleRequest = (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ): void => {
    if (request.method !== HTTP_METHOD.POST) {
      next();
      return;
    }

    void handler(request, response);
  };

  middlewares.use("/api/callFunction", handleRequest);
  middlewares.use("/__api/callFunction", handleRequest);
};

export const devFunctionsPlugin = (): Plugin => ({
  configurePreviewServer(server: PreviewServer): void {
    attachMiddlewares(server.middlewares);
  },
  configureServer(server: ViteDevServer): void {
    attachMiddlewares(server.middlewares);
  },
  name: "dev-functions-bridge",
});
