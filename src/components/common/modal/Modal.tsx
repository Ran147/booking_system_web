import { useEffect, type ReactElement } from "react";
import type { NullableRef } from "@/types";
import { cn } from "@/utils/cn";
import {
  MODAL_KEYBOARD_KEY,
  MODAL_MAX_WIDTH,
} from "./constants/modal.constants";
import type { ModalProps } from "./models/modal.model";

const DEFAULT_CLOSE_LABEL = "Cerrar modal";

const maxWidthStyles: Record<string, string> = {
  [MODAL_MAX_WIDTH.FULL]: "max-w-full",
  [MODAL_MAX_WIDTH.LG]: "max-w-lg",
  [MODAL_MAX_WIDTH.MD]: "max-w-md",
  [MODAL_MAX_WIDTH.SM]: "max-w-sm",
  [MODAL_MAX_WIDTH.XL]: "max-w-xl",
};

export const Modal = ({
  children,
  className,
  closeAriaLabel = DEFAULT_CLOSE_LABEL,
  isOpen = false,
  maxWidth = MODAL_MAX_WIDTH.LG,
  onClose,
  title,
}: ModalProps & {
  readonly closeAriaLabel?: string;
}): NullableRef<ReactElement> => {
  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent): void => {
      if (
        keyboardEvent.key === MODAL_KEYBOARD_KEY.ESCAPE &&
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
      document.body.style.overflow = "unset";
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

  const selectedMaxWidth =
    maxWidthStyles[maxWidth] ?? maxWidthStyles[MODAL_MAX_WIDTH.LG];

  return (
    <div
      aria-labelledby={title ? "modal-title" : undefined}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Modal Dialog Content */}
      <div
        className={cn(
          "relative z-10 w-full rounded-2xl bg-background border border-border p-6 shadow-2xl transition-all duration-200 text-foreground",
          selectedMaxWidth,
          className,
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          {title && (
            <h2
              className="text-lg font-semibold text-foreground tracking-tight"
              id="modal-title"
            >
              {title}
            </h2>
          )}
          {onClose && (
            <button
              aria-label={closeAriaLabel}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              onClick={onClose}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          )}
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
