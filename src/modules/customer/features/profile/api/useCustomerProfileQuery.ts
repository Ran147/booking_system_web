import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Nullable } from "@/types";
import { customerProfileQueryKeys } from "./customerProfileQueryKeys";
import { fetchCustomerProfile } from "./fetchCustomerProfile";
import type { CustomerProfile } from "../models";

export const useCustomerProfileQuery = (
  userId: string,
): UseQueryResult<Nullable<CustomerProfile>> =>
  useQuery({
    queryFn: () => fetchCustomerProfile(userId),
    queryKey: customerProfileQueryKeys.detail(userId),
  });
