import type { ReactElement } from "react";
import { Toaster } from "@/shared/components";
import { useTheme } from "./useTheme";

export const ThemedToaster = (): ReactElement => {
  const { themeMode } = useTheme();

  return <Toaster theme={themeMode} />;
};
