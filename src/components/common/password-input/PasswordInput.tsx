import { Eye, EyeOff } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useState,
  type ForwardedRef,
  type ReactElement,
} from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { Button } from "../button";
import { InputField } from "../input-field";
import type { PasswordInputProps } from "./models/passwordInput.model";

export const PasswordInput = forwardRef(
  (
    {
      inputClassName,
      visibilityResetKey = 0,
      ...restProperties
    }: PasswordInputProps,
    reference: ForwardedRef<HTMLInputElement>,
  ): ReactElement => {
    const { t } = useTranslation(I18N_NAMESPACE.COMMON);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    useEffect(() => {
      setIsPasswordVisible(false);
    }, [visibilityResetKey]);

    const handleToggleVisibility = (): void => {
      setIsPasswordVisible((currentVisibility) => !currentVisibility);
    };

    const visibilityLabel = isPasswordVisible
      ? t("auth.password.hide")
      : t("auth.password.show");
    const VisibilityIcon = isPasswordVisible ? EyeOff : Eye;

    return (
      <InputField
        {...restProperties}
        endAdornment={
          <Button
            ariaLabel={visibilityLabel}
            aria-pressed={isPasswordVisible}
            onClick={handleToggleVisibility}
            size="icon"
            type="button"
            variant="ghost"
          >
            <VisibilityIcon aria-hidden="true" className="size-4" />
          </Button>
        }
        inputClassName={`pr-12 ${inputClassName ?? ""}`}
        ref={reference}
        type={isPasswordVisible ? "text" : "password"}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
