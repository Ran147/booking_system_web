import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { MutationError } from "@/shared/types";
import { fetchActivePlanDetails } from "./fetchActivePlanDetails";

// Reads the plans again when the visitor contracts, so a plan deactivated
// while the detail was open does not open the checkout (AC-KAN-21-10). It
// leaves the page's own read untouched: the detail stays on screen.
export const useVerifyPlanIsActiveMutation = (): UseMutationResult<
  boolean,
  MutationError,
  string
> =>
  useMutation<boolean, MutationError, string>({
    mutationFn: async (planId) => {
      const activePlans = await fetchActivePlanDetails();
      return activePlans.some((activePlan) => activePlan.id === planId);
    },
  });
