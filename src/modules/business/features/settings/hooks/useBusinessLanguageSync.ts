import { useSession, useUserLanguageSync } from "@/modules/auth";
import { SESSION_STATUS } from "@/modules/auth/constants/SessionStatus.constants";

export const useBusinessLanguageSync = (): void => {
  const session = useSession();
  const userId =
    session.status === SESSION_STATUS.SIGNED_IN ? session.userId : "";
  useUserLanguageSync(userId);
};
