import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import { ThemeContext } from "@/app/providers/theme/ThemeContext";
import { THEME_MODE } from "@/constants";
import type { Session } from "@/modules/auth";
import { AuthContext } from "@/modules/auth/context/AuthContext";
import { testI18n } from "./testI18n";

const setTestThemeMode = (): void => undefined;

export interface RenderWithProvidersOptions {
  initialPath: string;
  session: Session;
}

export const renderWithProviders = (
  element: ReactElement,
  { initialPath, session }: RenderWithProvidersOptions,
): RenderResult => {
  const testQueryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  return render(
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
            <MemoryRouter initialEntries={[initialPath]}>
              {element}
            </MemoryRouter>
          </AuthContext.Provider>
        </ThemeContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
};
