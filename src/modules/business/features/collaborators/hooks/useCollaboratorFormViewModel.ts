import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "@/components/common";
import { I18N_NAMESPACE, ROUTE_PATH, STRING } from "@/constants";
import { COLLABORATOR_STATUS, type CollaboratorPermission } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import {
  buildCollaboratorInvitationUrl,
  useActiveServicesForCollaboratorQuery,
  useCollaboratorDetailQuery,
  useCollaboratorUsageQuery,
  useRegisterCollaboratorMutation,
  useUpdateCollaboratorMutation,
  type CollaboratorMutationError,
} from "../api";
import {
  COLLABORATOR_ERROR_REASON,
  DEFAULT_COLLABORATOR_FORM_VALUES,
} from "../constants/CollaboratorFeature.constants";
import {
  collaboratorFormSchema,
  type CollaboratorFormValues,
  type CollaboratorFormViewModel,
  type CollaboratorInvitationLinkDialogState,
  type CollaboratorLimitDialogState,
} from "../models";

/**
 * ViewModel para registrar (KAN-78) y editar (KAN-80) colaboradores.
 * @returns {CollaboratorFormViewModel}
 */
export const useCollaboratorFormViewModel = (): CollaboratorFormViewModel => {
  const navigate = useNavigate();
  const { collaboratorId } = useParams();
  const isEditMode = Boolean(collaboratorId);
  const { businessId } = useCurrentBusiness();
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
    I18N_NAMESPACE.VALIDATION,
  ]);

  const [serverErrorKey, setServerErrorKey] = useState<Nullable<string>>(null);
  const hydratedSnapshotReference = useRef<Nullable<string>>(null);
  const [pendingNavigationPath, setPendingNavigationPath] =
    useState<Nullable<string>>(null);
  const [limitDialog, setLimitDialog] = useState<CollaboratorLimitDialogState>({
    hasHigherPlan: false,
    isOpen: false,
    limit: null,
  });
  const [invitationLinkDialog, setInvitationLinkDialog] =
    useState<CollaboratorInvitationLinkDialogState>({
      collaboratorName: STRING.EMPTY,
      invitationUrl: STRING.EMPTY,
      isOpen: false,
    });

  const activeServicesQuery = useActiveServicesForCollaboratorQuery(businessId);
  const detailQuery = useCollaboratorDetailQuery(
    businessId,
    collaboratorId ?? "",
  );
  const usageQuery = useCollaboratorUsageQuery(businessId);
  const registerMutation = useRegisterCollaboratorMutation(businessId);
  const updateMutation = useUpdateCollaboratorMutation(businessId);

  const form = useForm<CollaboratorFormValues>({
    defaultValues: {
      ...DEFAULT_COLLABORATOR_FORM_VALUES,
      permissions: [],
      serviceIds: [],
    },
    mode: "onTouched",
    resolver: zodResolver(collaboratorFormSchema),
  });

  const detail = detailQuery.data ?? null;
  const activeServices = activeServicesQuery.data ?? [];
  const isReadOnly = usageQuery.data?.isReadOnly ?? false;
  const isEmailLocked =
    isEditMode &&
    detail !== null &&
    detail.status !== COLLABORATOR_STATUS.INVITED;

  useEffect(() => {
    if (!isEditMode || !detail) {
      return;
    }
    const nextSnapshotKey = `${detail.id}:${detail.updatedAt}`;
    if (hydratedSnapshotReference.current === nextSnapshotKey) {
      return;
    }
    form.reset({
      email: detail.email,
      fullName: detail.fullName,
      permissions: [...detail.permissions],
      phone: detail.phone,
      serviceIds: [...detail.serviceIds],
      specialty: detail.specialty ?? "",
    });
    hydratedSnapshotReference.current = nextSnapshotKey;
  }, [detail, form, isEditMode]);

  const selectedServiceIds = useWatch({
    control: form.control,
    name: "serviceIds",
  });
  const selectedPermissions = useWatch({
    control: form.control,
    name: "permissions",
  });

  const removedServicesBookingsCount =
    isEditMode && detail
      ? detail.serviceIds
          .filter((serviceId) => !selectedServiceIds.includes(serviceId))
          .reduce(
            (accumulator, removedId) =>
              accumulator +
              (detail.upcomingBookingsByService?.[removedId] ?? 0),
            0,
          )
      : 0;

  const handleToggleService = (serviceId: string): void => {
    const current = form.getValues("serviceIds");
    const next = current.includes(serviceId)
      ? current.filter((item) => item !== serviceId)
      : [...current, serviceId];
    form.setValue("serviceIds", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleTogglePermission = (permission: CollaboratorPermission): void => {
    const current = form.getValues("permissions");
    const next = current.includes(permission)
      ? current.filter((item) => item !== permission)
      : [...current, permission];
    form.setValue("permissions", next, { shouldDirty: true });
  };

  const submitForm = async (values: CollaboratorFormValues): Promise<void> => {
    setServerErrorKey(null);
    try {
      if (isEditMode && collaboratorId) {
        const updateResult = await updateMutation.mutateAsync({
          businessId,
          collaboratorId,
          email: isEmailLocked ? undefined : values.email.trim().toLowerCase(),
          expectedUpdatedAt: detail?.updatedAt || undefined,
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          serviceIds: values.serviceIds,
          specialty: values.specialty.trim() || null,
        });
        toast.success(t("business:collaborators.edit.success"));
        const profilePath = `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}/${collaboratorId}`;
        if (updateResult.emailChanged && updateResult.invitationToken) {
          setPendingNavigationPath(profilePath);
          setInvitationLinkDialog({
            collaboratorName: values.fullName.trim(),
            invitationUrl: buildCollaboratorInvitationUrl(
              updateResult.invitationToken,
            ),
            isOpen: true,
          });
          return;
        }
        void navigate(profilePath);
        return;
      }

      const registerResult = await registerMutation.mutateAsync({
        businessId,
        email: values.email.trim().toLowerCase(),
        fullName: values.fullName.trim(),
        permissions: values.permissions,
        phone: values.phone.trim(),
        serviceIds: values.serviceIds,
        specialty: values.specialty.trim() || null,
      });
      toast.success(t("business:collaborators.create.success"));
      const listPath = `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`;
      if (registerResult.invitationToken) {
        setPendingNavigationPath(listPath);
        setInvitationLinkDialog({
          collaboratorName: values.fullName.trim(),
          invitationUrl: buildCollaboratorInvitationUrl(
            registerResult.invitationToken,
          ),
          isOpen: true,
        });
        return;
      }
      void navigate(listPath);
    } catch (error) {
      const mapped = error as CollaboratorMutationError;
      if (mapped.reason === COLLABORATOR_ERROR_REASON.LIMIT_REACHED) {
        setLimitDialog({
          hasHigherPlan:
            mapped.hasHigherPlan ?? usageQuery.data?.hasHigherPlan ?? false,
          isOpen: true,
          limit: mapped.limit ?? usageQuery.data?.limit ?? 0,
        });
        return;
      }
      if (mapped.reason === COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE) {
        form.setError("email", { message: mapped.messageKey });
      }
      setServerErrorKey(mapped.messageKey);
    }
  };

  return {
    activeServices,
    form,
    handleCancel: (): void => {
      if (isEditMode && collaboratorId) {
        void navigate(
          `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}/${collaboratorId}`,
        );
        return;
      }
      void navigate(
        `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.COLLABORATORS}`,
      );
    },
    handleCloseInvitationLinkDialog: (): void => {
      setInvitationLinkDialog({
        collaboratorName: STRING.EMPTY,
        invitationUrl: STRING.EMPTY,
        isOpen: false,
      });
      const targetPath = pendingNavigationPath;
      setPendingNavigationPath(null);
      if (targetPath) {
        void navigate(targetPath);
      }
    },
    handleCloseLimitDialog: (): void => {
      setLimitDialog((current) => ({ ...current, isOpen: false }));
    },
    handleNavigateToServices: (): void => {
      void navigate(
        `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SERVICES}`,
      );
    },
    handleNavigateToUpgrade: (): void => {
      setLimitDialog((current) => ({ ...current, isOpen: false }));
      void navigate(ROUTE_PATH.LANDING.PLANS);
    },
    handleSubmit: form.handleSubmit(submitForm),
    handleTogglePermission,
    handleToggleService,
    hasNoActiveServices:
      !isEditMode &&
      !activeServicesQuery.isPending &&
      activeServices.length === 0,
    hasUpcomingBookingsError: Boolean(
      isEditMode && detail?.hasUpcomingBookingsError,
    ),
    invitationLinkDialog,
    isEditMode,
    isEmailLocked,
    isLoading:
      activeServicesQuery.isPending ||
      (isEditMode && detailQuery.isPending) ||
      usageQuery.isPending,
    isReadOnly,
    isSubmitting: registerMutation.isPending || updateMutation.isPending,
    limitDialog,
    loadError: detailQuery.isError
      ? "business:collaborators.profile.loadError"
      : null,
    removedServicesBookingsCount,
    selectedPermissions,
    selectedServiceIds,
    serverErrorKey,
  };
};
