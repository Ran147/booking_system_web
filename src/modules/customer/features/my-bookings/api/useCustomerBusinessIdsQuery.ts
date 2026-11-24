import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchCustomerBusinessIds } from "./fetchCustomerBusinessIds";
import { myBookingsQueryKeys } from "./myBookingsQueryKeys";
import { NO_CUSTOMER_USER_ID } from "../constants";

export const useCustomerBusinessIdsQuery = (
  customerUserId: string,
): UseQueryResult<string[]> =>
  useQuery({
    enabled: customerUserId !== NO_CUSTOMER_USER_ID,
    queryFn: () => fetchCustomerBusinessIds(customerUserId),
    queryKey: myBookingsQueryKeys.businessIds(customerUserId),
  });
