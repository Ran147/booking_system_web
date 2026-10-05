import { zodResolver } from "@hookform/resolvers/zod";
import type { ChangeEvent } from "react";
import { useForm, useWatch, type FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  I18N_NAMESPACE,
  VALIDATION_MESSAGE_KEY,
  type ValidationMessageKey,
} from "@/shared/constants";
import type { NullableUndefined } from "@/shared/types";
import { BUSINESS_SLUG_PATH_PREFIX } from "../constants/SubscriberSignUpForm.constants";
import { DEFAULT_SUBSCRIBER_SIGN_UP_FORM_VALUES } from "../constants/SubscriberSignUpFormDefaults.constants";
import {
  subscriberSignUpFormSchema,
  type SubscriberSignUpFormValues,
} from "../models/SubscriberSignUpForm.schema";
import type {
  SubscriberSignUpFieldErrors,
  SubscriberSignUpFormProps,
  SubscriberSignUpFormViewModel,
} from "../models/SubscriberSignUpFormViewModel.interface";
import { isSubscriberSignUpMessageKey } from "../utils/isSubscriberSignUpMessageKey";
import { suggestBusinessSlug } from "../utils/suggestBusinessSlug";

const isValidationMessageKey = (
  message: string,
): message is ValidationMessageKey =>
  Object.values(VALIDATION_MESSAGE_KEY).some(
    (messageKey) => messageKey === message,
  );

export const useSubscriberSignUpFormViewModel = ({
  checkoutEmail,
  onSubmit,
}: SubscriberSignUpFormProps): SubscriberSignUpFormViewModel => {
  const { t } = useTranslation([
    I18N_NAMESPACE.LANDING,
    I18N_NAMESPACE.VALIDATION,
  ]);
  const form = useForm<SubscriberSignUpFormValues>({
    defaultValues: {
      ...DEFAULT_SUBSCRIBER_SIGN_UP_FORM_VALUES,
      email: checkoutEmail,
    },
    mode: "onBlur",
    resolver: zodResolver(subscriberSignUpFormSchema),
  });
  const { errors, isSubmitting } = form.formState;
  const [password, businessSlug] = useWatch({
    control: form.control,
    name: ["password", "businessSlug"],
  });

  // Schemas store message keys; validation keys live in their own namespace,
  // the rest are feature keys under landing:subscriberSignUp.
  const translateFieldError = (
    fieldError: NullableUndefined<FieldError>,
  ): NullableUndefined<string> => {
    const messageKey = fieldError?.message;
    if (!messageKey) return undefined;
    if (isValidationMessageKey(messageKey))
      return t(`validation:${messageKey}`);
    if (isSubscriberSignUpMessageKey(messageKey)) {
      return t(`landing:${messageKey}`);
    }
    return undefined;
  };

  // The slug follows the business name until the visitor edits it.
  const handleBusinessNameChange = (
    changeEvent: ChangeEvent<HTMLInputElement>,
  ): void => {
    if (form.getFieldState("businessSlug").isDirty) return;
    form.setValue(
      "businessSlug",
      suggestBusinessSlug(changeEvent.target.value),
      { shouldValidate: form.formState.isSubmitted },
    );
  };

  const fieldErrors: SubscriberSignUpFieldErrors = {
    businessName: translateFieldError(errors.businessName),
    businessSlug: translateFieldError(errors.businessSlug),
    email: translateFieldError(errors.email),
    firstName: translateFieldError(errors.firstName),
    lastName: translateFieldError(errors.lastName),
    password: translateFieldError(errors.password),
    passwordConfirmation: translateFieldError(errors.passwordConfirmation),
    phone: translateFieldError(errors.phone),
  };

  return {
    businessAddress: `${BUSINESS_SLUG_PATH_PREFIX}${businessSlug}`,
    fieldErrors,
    fields: {
      businessName: form.register("businessName", {
        onChange: handleBusinessNameChange,
      }),
      businessSlug: form.register("businessSlug"),
      email: form.register("email"),
      firstName: form.register("firstName"),
      lastName: form.register("lastName"),
      password: form.register("password"),
      passwordConfirmation: form.register("passwordConfirmation"),
      phone: form.register("phone"),
    },
    handleSubmit: form.handleSubmit(onSubmit),
    isSubmitting,
    password,
  };
};
