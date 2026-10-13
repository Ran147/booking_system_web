import { useState, type MouseEvent } from "react";
import type {
  UsePasswordInputParameters,
  UsePasswordInputReturn,
} from "./models/passwordInput.model";

export const usePasswordInput = ({
  isVisible,
  onToggleVisibility,
  visibilityResetKey,
}: UsePasswordInputParameters): UsePasswordInputReturn => {
  const [isVisibleInternally, setIsVisibleInternally] =
    useState<boolean>(false);
  const [lastVisibilityResetKey, setLastVisibilityResetKey] =
    useState(visibilityResetKey);

  // A new reset key hides the password again. Adjusting state while
  // rendering avoids an extra render with the old value.
  if (visibilityResetKey !== lastVisibilityResetKey) {
    setLastVisibilityResetKey(visibilityResetKey);
    setIsVisibleInternally(false);
  }

  const isControlled = isVisible !== undefined;

  return {
    // Keeps the focus (and the cursor position) in the field when the toggle
    // is clicked with the pointer. Keyboard users still reach it with Tab.
    handleToggleMouseDown: (
      mouseEvent: MouseEvent<HTMLButtonElement>,
    ): void => {
      mouseEvent.preventDefault();
    },
    handleToggleVisibility: (): void => {
      if (isControlled) {
        onToggleVisibility?.();
        return;
      }
      setIsVisibleInternally((wasVisible) => !wasVisible);
    },
    isPasswordVisible: isControlled ? isVisible : isVisibleInternally,
  };
};
