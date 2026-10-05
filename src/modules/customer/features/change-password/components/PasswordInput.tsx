import { Eye, EyeOff } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  FormControl,
  FormField,
  FormItem,
  InputField,
} from "@/components/common";
import { I18N_NAMESPACE, type ValidationMessageKey } from "@/constants";
import type { NullableUndefined } from "@/types";
import { CHANGE_PASSWORD_MESSAGE_KEY, PASSWORD_FIELD_NAME } from "../constants";
import type { PasswordInputProps } from "../models";

export const PasswordInput = ({
  disabled,
  label,
  name,
  viewModel,
}: PasswordInputProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);
  const { t: tValidation } = useTranslation(I18N_NAMESPACE.VALIDATION);
  const isVisible = viewModel.isPasswordVisible[name];

  const resolveError = (
    messageKey?: NullableUndefined<string>,
  ): NullableUndefined<string> => {
    if (!messageKey) return undefined;
    if (messageKey === CHANGE_PASSWORD_MESSAGE_KEY.CURRENT_INVALID)
      return t("profile.password.currentInvalidError");
    if (messageKey === CHANGE_PASSWORD_MESSAGE_KEY.MISMATCH)
      return t("profile.password.mismatchError");
    if (messageKey === CHANGE_PASSWORD_MESSAGE_KEY.SAME_AS_CURRENT)
      return t("profile.password.sameAsCurrentError");
    return tValidation(messageKey as ValidationMessageKey);
  };

  return (
    <FormField
      control={viewModel.form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex items-end gap-2">
            <FormControl>
              <InputField
                autoComplete={
                  name === PASSWORD_FIELD_NAME.CURRENT_PASSWORD
                    ? "current-password"
                    : "new-password"
                }
                disabled={disabled}
                error={resolveError(fieldState.error?.message)}
                label={label}
                required
                type={isVisible ? "text" : "password"}
                {...field}
              />
            </FormControl>
            <Button
              ariaLabel={t(
                isVisible
                  ? "profile.password.hidePassword"
                  : "profile.password.showPassword",
              )}
              disabled={disabled}
              onClick={() => viewModel.handleToggleVisibility(name)}
              size="icon"
              type="button"
              variant="outline"
            >
              {isVisible ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
            </Button>
          </div>
        </FormItem>
      )}
    />
  );
};
