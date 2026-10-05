import { useState, type MouseEvent } from "react";
import type { UsePasswordInputReturn } from "./models/passwordInput.model";

export const usePasswordInput = (): UsePasswordInputReturn => {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

  return {
    // Keeps the focus (and the cursor position) in the field when the toggle
    // is clicked with the pointer.
    handleToggleMouseDown: (
      mouseEvent: MouseEvent<HTMLButtonElement>,
    ): void => {
      mouseEvent.preventDefault();
    },
    handleToggleVisibility: (): void => {
      setIsPasswordVisible((wasPasswordVisible) => !wasPasswordVisible);
    },
    isPasswordVisible,
  };
};
