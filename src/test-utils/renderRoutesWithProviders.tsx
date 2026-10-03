import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from "react-router";
import type { Session } from "@/modules/auth";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { testI18n } from "./testI18n";

export interface RenderRoutesWithProvidersOptions {
  initialPath: string;
  session: Session;
}

// Like renderWithProviders, but for a route tree (lazy routes, guards and
// redirects) instead of a single element.
export const renderRoutesWithProviders = (
  routes: RouteObject[],
  { initialPath, session }: RenderRoutesWithProvidersOptions,
): RenderResult => {
  const testQueryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const testRouter = createMemoryRouter(routes, {
    initialEntries: [initialPath],
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      <I18nextProvider i18n={testI18n}>
        <AuthContext.Provider value={{ session }}>
          <RouterProvider router={testRouter} />
        </AuthContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
};
