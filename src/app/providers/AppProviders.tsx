import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/i18n/i18n";
import { AuthProvider } from "@/modules/auth";
import { queryClient } from "./query/queryClient";
import { ThemeProvider } from "./theme/ThemeProvider";
import { ThemedToaster } from "./theme/ThemedToaster";

export interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactElement => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  </QueryClientProvider>
);
