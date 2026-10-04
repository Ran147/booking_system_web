import type { ThemeMode } from "@/constants";

/**
 * @typedef {Object} ThemeContextValue
 * @property {ThemeMode} mode - Modo de tema activo (light, dark, system)
 * @property {ThemeMode} resolvedMode - Modo computado (light o dark)
 * @property {(mode: ThemeMode) => void} setMode - Cambia el modo de tema activo
 */
export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "dark" | "light";
  setMode: (mode: ThemeMode) => void;
}
