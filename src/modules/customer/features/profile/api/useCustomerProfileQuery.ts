import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Nullable } from "@/types";
import type { CustomerProfile } from "../models";
import { customerProfileQueryKeys } from "./customerProfileQueryKeys";
import { fetchCustomerProfile } from "./fetchCustomerProfile";

export const useCustomerProfileQuery = (
  userId: string,
): UseQueryResult<Nullable<CustomerProfile>, Error> =>
  useQuery({
    enabled: userId.length > 0,
    queryFn: () => fetchCustomerProfile(userId),
    queryKey: customerProfileQueryKeys.detail(userId),
  });
