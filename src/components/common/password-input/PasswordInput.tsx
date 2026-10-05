import { Eye, EyeOff } from "lucide-react";
import { forwardRef, type ForwardedRef, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { PasswordInputProps } from "./models/passwordInput.model";
import { usePasswordInput } from "./usePasswordInput";
import { Button } from "../button";
import {
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from "../button/constants/button.constants";
import { InputField } from "../input-field";

const INPUT_TYPE = {
  PASSWORD: "password",
  TEXT: "text",
} as const;

export const PasswordInput = forwardRef(
  (
    { disabled, ...inputFieldProperties }: PasswordInputProps,
    reference: ForwardedRef<HTMLInputElement>,
  ): ReactElement => {
    const { t } = useTranslation(I18N_NAMESPACE.COMMON);
    const { handleToggleMouseDown, handleToggleVisibility, isPasswordVisible } =
      usePasswordInput();
    const VisibilityIcon = isPasswordVisible ? EyeOff : Eye;

    return (
      <InputField
        {...inputFieldProperties}
        disabled={disabled}
        ref={reference}
        trailingElement={
          <Button
            ariaLabel={t(
              isPasswordVisible ? "password.hideAction" : "password.showAction",
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
        type={isPasswordVisible ? INPUT_TYPE.TEXT : INPUT_TYPE.PASSWORD}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
