import { useState } from "react";
import { generatePath } from "react-router";
import { ROUTE_PATH } from "@/constants";
import type { BusinessPublicProfile } from "@/domain";
import type { Nullable } from "@/types";
import type { CustomerNavbarViewModel } from "../models";

const readTrimmedValue = (value?: Nullable<string>): Nullable<string> => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

/** Builds the business identity shown in the customer navbar. */
export const useCustomerNavbarViewModel = (
  business?: Nullable<BusinessPublicProfile>,
): CustomerNavbarViewModel => {
  const businessName = readTrimmedValue(business?.name);
  const sourceLogoUrl = readTrimmedValue(business?.logoUrl);
  const [failedLogoUrl, setFailedLogoUrl] = useState<Nullable<string>>(null);

  return {
    businessHomePath:
      businessName && business
        ? generatePath(ROUTE_PATH.CUSTOMER.ROOT, {
            businessSlug: business.slug,
          })
        : null,
    businessName,
    handleLogoError: (): void => {
      setFailedLogoUrl(sourceLogoUrl);
    },
    logoUrl: failedLogoUrl === sourceLogoUrl ? null : sourceLogoUrl,
  };
};
