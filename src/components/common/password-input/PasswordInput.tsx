import { Eye, EyeOff } from "lucide-react";
import { forwardRef, type ForwardedRef, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { PASSWORD_INPUT_TYPE } from "./constants/passwordInput.constants";
import type { PasswordInputProps } from "./models/passwordInput.model";
import { usePasswordInput } from "./usePasswordInput";
import { Button } from "../button";
import {
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from "../button/constants/button.constants";
import { InputField } from "../input-field";

// Shared by sign-in (US-33), sign-up (KAN-25), change password (KAN-53,
// HU-171) and password recovery.
export const PasswordInput = forwardRef(
  (
    {
      disabled,
      isVisible,
      onToggleVisibility,
      visibilityResetKey,
      ...inputFieldProperties
    }: PasswordInputProps,
    reference: ForwardedRef<HTMLInputElement>,
  ): ReactElement => {
    const { t } = useTranslation(I18N_NAMESPACE.COMMON);
    const { handleToggleMouseDown, handleToggleVisibility, isPasswordVisible } =
      usePasswordInput({ isVisible, onToggleVisibility, visibilityResetKey });
    const VisibilityIcon = isPasswordVisible ? EyeOff : Eye;

    return (
      <InputField
        {...inputFieldProperties}
        disabled={disabled}
        endAdornment={
          <Button
            ariaLabel={t(
              isPasswordVisible ? "auth.password.hide" : "auth.password.show",
            )}
            aria-pressed={isPasswordVisible}
            disabled={disabled}
            onClick={handleToggleVisibility}
            onMouseDown={handleToggleMouseDown}
            size={BUTTON_SIZE.ICON}
            type="button"
            variant={BUTTON_VARIANT.GHOST}
          >
            <VisibilityIcon aria-hidden="true" className="size-4" />
          </Button>
        }
        ref={reference}
        type={
          isPasswordVisible
            ? PASSWORD_INPUT_TYPE.VISIBLE
            : PASSWORD_INPUT_TYPE.HIDDEN
        }
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
