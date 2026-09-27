import type { ReactElement, ReactNode } from "react";
import { ThemeContext } from "./ThemeContext";
import { useThemeController } from "./useThemeController";

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({
  children,
}: ThemeProviderProps): ReactElement => {
  const themeContextValue = useThemeController();

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
