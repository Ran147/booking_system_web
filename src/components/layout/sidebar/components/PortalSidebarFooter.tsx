import { LogOut } from "lucide-react";
import type { ReactElement } from "react";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/common";

export interface PortalSidebarFooterProps {
  readonly onSignOut?: () => void;
  readonly signOutLabel?: string;
}

export const PortalSidebarFooter = ({
  onSignOut,
  signOutLabel = "Cerrar sesión",
}: PortalSidebarFooterProps): ReactElement => {
  return (
    <div className="border-t border-border/70 pt-4">
      <Button
        className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        onClick={onSignOut}
        size={BUTTON_SIZE.MD}
        type="button"
        variant={BUTTON_VARIANT.GHOST}
      >
        <LogOut className="size-4 shrink-0 text-destructive" />
        <span>{signOutLabel}</span>
      </Button>
    </div>
  );
};
