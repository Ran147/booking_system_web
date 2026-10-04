import { createContext } from "react";
import type { Nullable } from "@/types";
import type { AuthContextValue } from "./models/authContext.model";

export const AuthContext = createContext<Nullable<AuthContextValue>>(null);
