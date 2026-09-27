import { createContext } from "react";
import type { Nullable } from "@/shared/types";
import type { ThemeContextValue } from "./ThemeContextValue.interface";

export const ThemeContext = createContext<Nullable<ThemeContextValue>>(null);
