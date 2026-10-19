import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import {
  createMemoryRouter,
  parsePath,
  RouterProvider,
  type RouteObject,
} from "react-router";
import { ThemeContext } from "@/app/providers/theme/ThemeContext";
import { THEME_MODE } from "@/constants";
import type { Session } from "@/modules/auth";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { testI18n } from "./testI18n";

const setTestThemeMode = (): void => undefined;

export interface RenderRoutesWithProvidersOptions {
  initialPath: string;
  /** Router state of the first entry, as navigate(path, { state }) sends it. */
  initialState?: unknown;
  session: Session;
}

export type RenderRoutesWithProvidersResult = RenderResult & {
  /** The memory router, to read where it ended up (location, state). */
  readonly router: ReturnType<typeof createMemoryRouter>;
};

// Like renderWithProviders, but for a route tree (lazy routes, guards and
// redirects) instead of a single element.
export const renderRoutesWithProviders = (
  routes: RouteObject[],
  { initialPath, initialState, session }: RenderRoutesWithProvidersOptions,
): RenderRoutesWithProvidersResult => {
  const testQueryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const testRouter = createMemoryRouter(routes, {
    initialEntries: [{ ...parsePath(initialPath), state: initialState }],
  });

  const renderResult = render(
    <QueryClientProvider client={testQueryClient}>
      <I18nextProvider i18n={testI18n}>
        <ThemeContext.Provider
          value={{
            isDarkApplied: false,
            setThemeMode: setTestThemeMode,
            themeMode: THEME_MODE.SYSTEM,
          }}
        >
          <AuthContext.Provider value={{ session }}>
            <RouterProvider router={testRouter} />
          </AuthContext.Provider>
        </ThemeContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>,
  );

  return { ...renderResult, router: testRouter };
};
