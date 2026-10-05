import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "@/components/common";
import {
  ERROR_MESSAGE_KEY,
  I18N_NAMESPACE,
  VIEW_STATE,
  type ViewState,
} from "@/constants";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import { mapFirebaseError } from "@/services/firebase";
import {
  useCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
} from "../api";
import {
  profileFormSchema,
  type ProfileFormValues,
  type ProfileFormViewModel,
} from "../models";

const EMPTY_PROFILE_FORM: ProfileFormValues = { fullName: "", phone: "" };

export const useProfileFormViewModel = (): ProfileFormViewModel => {
  const { t } = useTranslation([
    I18N_NAMESPACE.CUSTOMER,
    I18N_NAMESPACE.COMMON,
  ]);
  const navigate = useNavigate();
  const session = useSession();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
  const profileQuery = useCustomerProfileQuery(userId);
  const updateMutation = useUpdateCustomerProfileMutation();
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    defaultValues: EMPTY_PROFILE_FORM,
    mode: "onBlur",
    resolver: zodResolver(profileFormSchema) as Resolver<ProfileFormValues>,
  });

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        fullName: profileQuery.data.fullName,
        phone: profileQuery.data.phone,
      });
    }
  }, [form, profileQuery.data]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (!form.formState.isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return (): void => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [form.formState.isDirty]);

  const submitProfile = (formValues: ProfileFormValues): void => {
    if (!form.formState.isDirty || userId.length === 0) return;

    updateMutation.mutate(
      { formValues, userId },
      {
        onError: (error) => toast.error(t(`common:${error.messageKey}`)),
        onSuccess: (updatedProfile) => {
          form.reset(updatedProfile);
          toast.success(t("customer:profile.edit.saveSuccess"));
        },
      },
    );
  };

  const handleCancel = (): void => {
    if (form.formState.isDirty) {
      setIsDiscardDialogOpen(true);
      return;
    }
    navigate(-1);
  };

  let viewState: ViewState = VIEW_STATE.READY;
  if (profileQuery.isPending) viewState = VIEW_STATE.LOADING;
  else if (profileQuery.isError) viewState = VIEW_STATE.ERROR;
  else if (!profileQuery.data) viewState = VIEW_STATE.EMPTY;

  return {
    canSubmit: form.formState.isDirty && !updateMutation.isPending,
    email: profileQuery.data?.email ?? "",
    errorMessageKey: profileQuery.error
      ? mapFirebaseError(profileQuery.error).messageKey
      : ERROR_MESSAGE_KEY.UNKNOWN,
    form,
    handleCancel,
    handleDiscardChanges: () => navigate(-1),
    handleKeepEditing: () => setIsDiscardDialogOpen(false),
    handleSubmit: form.handleSubmit(submitProfile),
    isDiscardDialogOpen,
    isSubmitting: updateMutation.isPending,
    profile: profileQuery.data
      ? {
          fullName: profileQuery.data.fullName,
          phone: profileQuery.data.phone,
        }
      : null,
    retry: async () => profileQuery.refetch(),
    viewState,
  };
};
