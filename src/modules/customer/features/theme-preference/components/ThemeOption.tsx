import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Button, BUTTON_VARIANT } from "@/components/common";
import type { ThemeMode } from "@/constants";

export interface ThemeOptionProps {
  description: string;
  icon: LucideIcon;
  isActive: boolean;
  isDisabled: boolean;
  label: string;
  onSelect: (themeMode: ThemeMode) => void;
  themeMode: ThemeMode;
}

export const ThemeOption = ({
  description,
  icon: Icon,
  isActive,
  isDisabled,
  label,
  onSelect,
  themeMode,
}: ThemeOptionProps): ReactElement => (
  <Button
    aria-pressed={isActive}
    className="h-auto min-h-28 w-full items-start justify-start p-5 text-left whitespace-normal"
    disabled={isDisabled}
    leftIcon={Icon}
    onClick={() => onSelect(themeMode)}
    variant={isActive ? BUTTON_VARIANT.DEFAULT : BUTTON_VARIANT.OUTLINE}
  >
    <span className="flex flex-col items-start gap-1">
      <span className="font-semibold">{label}</span>
      <span
        className={
          isActive ? "text-primary-foreground/80" : "text-muted-foreground"
        }
      >
        {description}
      </span>
    </span>
  </Button>
);
