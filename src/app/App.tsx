import type { ReactElement } from "react";
import { RouterProvider } from "react-router";
import { AppProviders } from "./providers/AppProviders";
import { router } from "./router/router";

export const App = (): ReactElement => (
  <AppProviders>
    <RouterProvider router={router} />
  </AppProviders>
);
