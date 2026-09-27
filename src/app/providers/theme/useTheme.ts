import { useContext } from "react";
import { PROVIDER_ERROR } from "@/shared/constants";
import { ThemeContext } from "./ThemeContext";
import type { ThemeContextValue } from "./ThemeContextValue.interface";

export const useTheme = (): ThemeContextValue => {
  const themeContextValue = useContext(ThemeContext);

  if (!themeContextValue) {
    throw new Error(PROVIDER_ERROR.MISSING_THEME_PROVIDER);
  }

  return themeContextValue;
};
