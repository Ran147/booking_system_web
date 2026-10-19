import {
  hashKey,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { signOut } from "firebase/auth";
import { auth, mapFirebaseError } from "@/services/firebase";
import type { MutationError } from "@/types";
import { planDetailQueryKeys } from "./planDetailQueryKeys";

// A new business is contracted signed out (AS-8). The session context updates
// itself when Firebase Auth signs out. Like useSignOut, the cached data of the
// user who left is removed; only the public plans on screen are kept, because
// the visitor stays on this page (useSignOut would go to sign-in).
export const useSignOutMutation = (): UseMutationResult<
  void,
  MutationError,
  void
> => {
  const queryClient = useQueryClient();

  return useMutation<void, MutationError, void>({
    mutationFn: async () => {
      try {
        await signOut(auth);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    onSuccess: () => {
      const activePlansQueryHash = hashKey(planDetailQueryKeys.active());
      queryClient.removeQueries({
        predicate: (query) => query.queryHash !== activePlansQueryHash,
      });
    },
  });
};
