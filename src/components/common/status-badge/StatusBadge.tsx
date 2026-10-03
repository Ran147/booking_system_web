import type { ReactElement, ReactNode } from "react";
import { TONE_CLASS_NAME, type Tone } from "@/shared/constants";
import { cn } from "@/shared/utils/cn";

export interface StatusBadgeProps {
  children: ReactNode;
  tone: Tone;
}

export const StatusBadge = ({
  children,
  tone,
}: StatusBadgeProps): ReactElement => (
  <span
    className={cn(
      "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium",
      TONE_CLASS_NAME[tone],
    )}
  >
    {children}
  </span>
);
