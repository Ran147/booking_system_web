import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { PAGINATION } from "@/constants";
import type { CursorPage, Nullable, PageCursor } from "@/types";
import {
  mapCollaboratorMutationError,
  registerCollaborator,
  resendCollaboratorEmail,
  updateCollaborator,
  updateCollaboratorPermissions,
  updateCollaboratorStatus,
  type CollaboratorMutationError,
  type RegisterCollaboratorPayload,
  type RegisterCollaboratorResponse,
  type ResendCollaboratorEmailPayload,
  type ResendCollaboratorEmailResponse,
  type UpdateCollaboratorPayload,
  type UpdateCollaboratorPermissionsPayload,
  type UpdateCollaboratorPermissionsResponse,
  type UpdateCollaboratorResponse,
  type UpdateCollaboratorStatusPayload,
  type UpdateCollaboratorStatusResponse,
} from "./collaboratorClient";
import { collaboratorQueryKeys } from "./collaboratorQueryKeys";
import { fetchActiveServicesForCollaborator } from "./fetchActiveServicesForCollaborator";
import { fetchCollaboratorDetail } from "./fetchCollaboratorDetail";
import { fetchCollaboratorListPage } from "./fetchCollaboratorListPage";
import { fetchCollaboratorUsage } from "./fetchCollaboratorUsage";
import type {
  ActiveServiceOption,
  CollaboratorDetailData,
  CollaboratorListFilters,
  CollaboratorListItem,
  CollaboratorUsageSummary,
} from "../models";

export const useCollaboratorListQuery = (
  businessId: string,
  filters: CollaboratorListFilters,
  pageCursor: Nullable<PageCursor>,
  pageNumber: number,
): UseQueryResult<CursorPage<CollaboratorListItem>> =>
  useQuery({
    enabled: Boolean(businessId),
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchCollaboratorListPage({
        businessId,
        filters,
        pageCursor,
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      }),
    queryKey: collaboratorQueryKeys.list(businessId, filters, pageNumber),
  });

export const useCollaboratorDetailQuery = (
  businessId: string,
  collaboratorId: string,
): UseQueryResult<Nullable<CollaboratorDetailData>> =>
  useQuery({
    enabled: Boolean(businessId) && Boolean(collaboratorId),
    queryFn: () => fetchCollaboratorDetail(businessId, collaboratorId),
    queryKey: collaboratorQueryKeys.detail(businessId, collaboratorId),
  });

export const useActiveServicesForCollaboratorQuery = (
  businessId: string,
): UseQueryResult<readonly ActiveServiceOption[]> =>
  useQuery({
    enabled: Boolean(businessId),
    queryFn: () => fetchActiveServicesForCollaborator(businessId),
    queryKey: collaboratorQueryKeys.activeServices(businessId),
  });

export const useCollaboratorUsageQuery = (
  businessId: string,
): UseQueryResult<CollaboratorUsageSummary> =>
  useQuery({
    enabled: Boolean(businessId),
    queryFn: () => fetchCollaboratorUsage(businessId),
    queryKey: collaboratorQueryKeys.usage(businessId),
  });

export const useRegisterCollaboratorMutation = (
  businessId: string,
): UseMutationResult<
  RegisterCollaboratorResponse,
  CollaboratorMutationError,
  RegisterCollaboratorPayload
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: RegisterCollaboratorPayload,
    ): Promise<RegisterCollaboratorResponse> => {
      try {
        return await registerCollaborator(payload);
      } catch (error) {
        throw mapCollaboratorMutationError(error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: collaboratorQueryKeys.all(businessId),
      });
    },
  });
};

export const useUpdateCollaboratorMutation = (
  businessId: string,
): UseMutationResult<
  UpdateCollaboratorResponse,
  CollaboratorMutationError,
  UpdateCollaboratorPayload
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: UpdateCollaboratorPayload,
    ): Promise<UpdateCollaboratorResponse> => {
      try {
        return await updateCollaborator(payload);
      } catch (error) {
        throw mapCollaboratorMutationError(error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: collaboratorQueryKeys.all(businessId),
      });
    },
  });
};

export const useUpdateCollaboratorStatusMutation = (
  businessId: string,
): UseMutationResult<
  UpdateCollaboratorStatusResponse,
  CollaboratorMutationError,
  UpdateCollaboratorStatusPayload
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: UpdateCollaboratorStatusPayload,
    ): Promise<UpdateCollaboratorStatusResponse> => {
      try {
        return await updateCollaboratorStatus(payload);
      } catch (error) {
        throw mapCollaboratorMutationError(error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: collaboratorQueryKeys.all(businessId),
      });
    },
  });
};

export const useUpdateCollaboratorPermissionsMutation = (
  businessId: string,
): UseMutationResult<
  UpdateCollaboratorPermissionsResponse,
  CollaboratorMutationError,
  UpdateCollaboratorPermissionsPayload
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: UpdateCollaboratorPermissionsPayload,
    ): Promise<UpdateCollaboratorPermissionsResponse> => {
      try {
        return await updateCollaboratorPermissions(payload);
      } catch (error) {
        throw mapCollaboratorMutationError(error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: collaboratorQueryKeys.all(businessId),
      });
    },
  });
};

export const useResendCollaboratorEmailMutation = (
  businessId: string,
): UseMutationResult<
  ResendCollaboratorEmailResponse,
  CollaboratorMutationError,
  ResendCollaboratorEmailPayload
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: ResendCollaboratorEmailPayload,
    ): Promise<ResendCollaboratorEmailResponse> => {
      try {
        return await resendCollaboratorEmail(payload);
      } catch (error) {
        throw mapCollaboratorMutationError(error);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: collaboratorQueryKeys.all(businessId),
      });
    },
  });
};
