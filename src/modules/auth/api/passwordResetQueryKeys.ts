import type { Nullable } from "@/types";

export const passwordResetQueryKeys = {
  code: (oobCode: Nullable<string>): readonly [string, Nullable<string>] => [
    "passwordResetCode",
    oobCode,
  ],
} as const;
