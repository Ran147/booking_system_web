import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";
import handler from "../api/callFunction";
import { HTTP_METHOD } from "../src/constants/common/HttpMethod.constants";

export const devFunctionsPlugin = (): Plugin => ({
  configureServer(server: ViteDevServer): void {
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

    server.middlewares.use("/api/callFunction", handleRequest);
    server.middlewares.use("/__api/callFunction", handleRequest);
  },
  name: "dev-functions-bridge",
});
