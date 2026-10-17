import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { CursorPage } from "@/types";
import { fetchServicePage } from "./fetchServicePage";
import { serviceQueryKeys } from "./serviceQueryKeys";
import type { ServiceListItem } from "../models/ServiceListItem.interface";
import type { ServiceListQueryParams } from "../models/ServiceListQueryParams.interface";

export const useServiceListQuery = (
  serviceListQueryParams: ServiceListQueryParams,
): UseQueryResult<CursorPage<ServiceListItem>> =>
  useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchServicePage(serviceListQueryParams),
    queryKey: serviceQueryKeys.list(serviceListQueryParams),
  });
