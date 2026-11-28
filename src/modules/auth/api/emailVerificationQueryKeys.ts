import type { Nullable } from "@/types";

export const emailVerificationQueryKeys = {
  code: (oobCode: Nullable<string>): readonly [string, Nullable<string>] => [
    "emailVerificationCode",
    oobCode,
  ],
} as const;
