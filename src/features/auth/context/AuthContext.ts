import { createContext } from "react";
import type { Nullable } from "@/shared/types";
import type { AuthContextValue } from "../models/AuthContextValue.interface";

export const AuthContext = createContext<Nullable<AuthContextValue>>(null);
