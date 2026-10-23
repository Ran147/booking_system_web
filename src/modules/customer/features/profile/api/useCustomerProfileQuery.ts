import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Nullable } from "@/types";
import { customerProfileQueryKeys } from "./customerProfileQueryKeys";
import { fetchCustomerProfile } from "./fetchCustomerProfile";
import { NO_CUSTOMER_USER_ID } from "../constants/Profile.constants";
import type { CustomerProfile } from "../models";

export const useCustomerProfileQuery = (
  userId: string,
): UseQueryResult<Nullable<CustomerProfile>> =>
  useQuery({
    enabled: userId !== NO_CUSTOMER_USER_ID,
    queryFn: () => fetchCustomerProfile(userId),
    queryKey: customerProfileQueryKeys.detail(userId),
  });
