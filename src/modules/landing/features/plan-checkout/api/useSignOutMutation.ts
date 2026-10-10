import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { signOut } from "firebase/auth";
import { auth, mapFirebaseError } from "@/shared/lib/firebase";
import type { MutationError } from "@/shared/types";

// A new business is contracted signed out (AS-8). The session context updates
// itself when Firebase Auth signs out.
export const useSignOutMutation = (): UseMutationResult<
  void,
  MutationError,
  void
> =>
  useMutation<void, MutationError, void>({
    mutationFn: async () => {
      try {
        await signOut(auth);
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
  });
