import { useEffect, type ReactElement } from "react";
import type { NullableRef } from "@/types";
import { cn } from "@/utils/cn";
import {
  DRAWER_KEYBOARD_KEY,
  DRAWER_POSITION,
} from "./constants/drawer.constants";
import type { DrawerProps } from "./models/drawer.model";

export const Drawer = ({
  backdropTestId = "drawer-backdrop",
  children,
  className,
  isOpen = false,
  onClose,
  position = DRAWER_POSITION.RIGHT,
  testId = "drawer",
}: DrawerProps): NullableRef<ReactElement> => {
  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent): void => {
      if (
        keyboardEvent.key === DRAWER_KEYBOARD_KEY.ESCAPE &&
        isOpen &&
        onClose
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return (): void => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (): void => {
    if (onClose) {
      onClose();
    }
  };

  const isLeft = position === DRAWER_POSITION.LEFT;

  return (
    <div
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-50 flex",
        isLeft ? "justify-start" : "justify-end",
      )}
      data-testid={testId}
      role="dialog"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        data-testid={backdropTestId}
        onClick={handleBackdropClick}
      />

      {/* Panel deslizante */}
      <aside
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col bg-background text-foreground border-border shadow-2xl transition-transform duration-300",
          isLeft ? "border-r" : "border-l",
          className,
        )}
      >
        {children}
      </aside>
    </div>
  );
};
