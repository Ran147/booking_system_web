import type { ReactElement } from "react";
import { Image } from "@/components";
import type { CustomerFooterIdentityProps } from "@/modules/customer/layout/models";

export const CustomerFooterIdentity = ({
  businessName,
  logoUrl,
  onLogoError,
}: CustomerFooterIdentityProps): ReactElement => (
  <div className="flex min-h-12 items-center">
    {logoUrl ? (
      <Image
        alt={businessName}
        className="h-14 w-14 rounded-full border border-border bg-background object-cover"
        onError={onLogoError}
        src={logoUrl}
      />
    ) : (
      <p className="text-xl font-semibold tracking-tight text-foreground">
        {businessName}
      </p>
    )}
  </div>
);
