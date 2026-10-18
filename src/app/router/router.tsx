import { createBrowserRouter } from "react-router";
import { RootLayout } from "./RootLayout";
import { appRoutes } from "./appRoutes";

export const router = createBrowserRouter([
  { children: appRoutes, Component: RootLayout },
]);
