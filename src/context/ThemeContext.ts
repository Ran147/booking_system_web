import { createContext } from "react";
import type { Nullable } from "@/types";
import type { ThemeContextValue } from "./models/themeContext.model";

export const ThemeContext = createContext<Nullable<ThemeContextValue>>(null);
