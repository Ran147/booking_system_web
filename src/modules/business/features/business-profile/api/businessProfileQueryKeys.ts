export const businessProfileQueryKeys = {
  detail: (businessId: string): readonly ["business-profile", string] => [
    "business-profile",
    businessId,
  ],
} as const;
