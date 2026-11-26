import {
  skipToken,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { STRING } from "@/constants";
import { USER_ROLE } from "@/domain";
import { SESSION_STATUS, useSession } from "@/modules/auth";
import type { NullableRef } from "@/types";
import { customerPersonalProfileQueryKeys } from "./customerPersonalProfileQueryKeys";
import { fetchCustomerPersonalProfile } from "./fetchCustomerPersonalProfile";
import type { CustomerPersonalProfile } from "../models";

export const useCustomerPersonalProfileQuery = (): UseQueryResult<
  NullableRef<CustomerPersonalProfile>,
  Error
> => {
  const session = useSession();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN &&
    (session.role === USER_ROLE.CUSTOMER || session.role === USER_ROLE.CLIENT)
      ? session.userId
      : STRING.EMPTY;

  return useQuery({
    // skipToken also prevents a manual refetch from reading without authorization.
    queryFn: userId
      ? (): Promise<NullableRef<CustomerPersonalProfile>> =>
          fetchCustomerPersonalProfile(userId)
      : skipToken,
    queryKey: customerPersonalProfileQueryKeys.detail(userId),
  });
};
