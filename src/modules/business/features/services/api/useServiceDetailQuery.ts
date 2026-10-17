import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError, Nullable } from "@/types";
import { fetchServiceDetail } from "./fetchServiceDetail";
import { serviceQueryKeys } from "./serviceQueryKeys";
import type { ServiceDetail } from "../models";

export interface UseServiceDetailQueryOptions {
  readonly businessId: string;
  readonly enabled?: boolean;
  readonly serviceId: Nullable<string>;
}

export const useServiceDetailQuery = ({
  businessId,
  enabled = true,
  serviceId,
}: UseServiceDetailQueryOptions): UseQueryResult<
  ServiceDetail,
  MutationError
> =>
  useQuery<ServiceDetail, MutationError>({
    enabled: Boolean(businessId && serviceId && enabled),
    queryFn: async () => {
      try {
        return await fetchServiceDetail(businessId, serviceId!);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    queryKey: serviceQueryKeys.detail(businessId, serviceId ?? ""),
  });
