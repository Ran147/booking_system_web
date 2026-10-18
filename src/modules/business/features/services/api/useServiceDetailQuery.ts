import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE, STRING } from "@/constants";
import { mapFirebaseError } from "@/services/firebase";
import type { MutationError, Nullable } from "@/types";
import { fetchServiceDetail } from "./fetchServiceDetail";
import { serviceQueryKeys } from "./serviceQueryKeys";
import type { ServiceDetail } from "../models";

export interface UseServiceDetailQueryOptions {
  readonly businessId: string;
  readonly enabled?: boolean;
  readonly initialData?: ServiceDetail;
  readonly serviceId: Nullable<string>;
}

export const useServiceDetailQuery = ({
  businessId,
  enabled = true,
  initialData,
  serviceId,
}: UseServiceDetailQueryOptions): UseQueryResult<
  ServiceDetail,
  MutationError
> =>
  useQuery<ServiceDetail, MutationError>({
    enabled: Boolean(businessId && serviceId && enabled),
    initialData,
    queryFn: async () => {
      if (!serviceId) {
        throw new FirebaseError(
          FIREBASE_ERROR_CODE.FIRESTORE_NOT_FOUND,
          "Service not found",
        );
      }
      try {
        return await fetchServiceDetail(businessId, serviceId);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    queryKey: serviceQueryKeys.detail(businessId, serviceId ?? STRING.EMPTY),
  });
