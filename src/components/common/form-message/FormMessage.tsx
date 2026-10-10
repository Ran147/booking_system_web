import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { Nullable } from "@/shared/types";
import { isValidationMessageKey } from "@/shared/utils";
import { cn } from "@/shared/utils/cn";
import { useFormField } from "../ui/form";

export interface FormMessageProps {
  className?: string;
}

// Schemas store VALIDATION_MESSAGE_KEY values as messages; this renders the
// translated text from the validation namespace (forms-validation-standards).
export const FormMessage = ({
  className,
}: FormMessageProps): Nullable<ReactElement> => {
  const { t } = useTranslation(I18N_NAMESPACE.VALIDATION);
  const { error, formMessageId } = useFormField();
  const errorMessage = error?.message;

  if (!isValidationMessageKey(errorMessage)) return null;

  return (
    <p
      className={cn("text-sm text-destructive", className)}
      data-slot="form-message"
      id={formMessageId}
    >
      {t(errorMessage)}
    </p>
  );
};
