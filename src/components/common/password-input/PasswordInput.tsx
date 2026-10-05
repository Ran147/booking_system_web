import { Eye, EyeOff } from "lucide-react";
import type { MouseEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { Button } from "../button";
import {
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from "../button/constants/button.constants";
import { Input } from "../ui/input";
import { PASSWORD_INPUT_TYPE } from "./constants/passwordInput.constants";
import type { PasswordInputProps } from "./models/passwordInput.model";

// Keeps the focus (and the cursor) in the input when the toggle is clicked
// with a pointer (KAN-35). Keyboard users still reach the toggle with Tab.
const keepInputFocus = (mouseEvent: MouseEvent<HTMLButtonElement>): void => {
  mouseEvent.preventDefault();
};

export const PasswordInput = ({
  className,
  disabled,
  isVisible,
  onToggleVisibility,
  ...inputProperties
}: PasswordInputProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className={cn("relative", className)}>
      <Input
        {...inputProperties}
        className="pr-10"
        disabled={disabled}
        type={
          isVisible ? PASSWORD_INPUT_TYPE.VISIBLE : PASSWORD_INPUT_TYPE.HIDDEN
        }
      />
      <Button
        aria-pressed={isVisible}
        ariaLabel={
          isVisible ? t("auth.password.hide") : t("auth.password.show")
        }
        className="absolute inset-y-0 right-0 h-full"
        disabled={disabled}
        leftIcon={isVisible ? EyeOff : Eye}
        onClick={onToggleVisibility}
        onMouseDown={keepInputFocus}
        size={BUTTON_SIZE.ICON}
        variant={BUTTON_VARIANT.GHOST}
      />
    </div>
  );
};
