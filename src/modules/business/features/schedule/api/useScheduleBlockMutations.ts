import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/services/firebase";
import type { Nullable } from "@/types";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export interface CreateScheduleBlockInput {
  readonly businessId: string;
  readonly collaboratorId?: Nullable<string>;
  readonly endsAt: Date;
  readonly isFullDay: boolean;
  readonly reason?: Nullable<string>;
  readonly startsAt: Date;
}

export interface DeleteScheduleBlockInput {
  readonly blockId: string;
  readonly businessId: string;
}

export interface ScheduleBlockMutationsResult {
  readonly createBlock: (input: CreateScheduleBlockInput) => Promise<string>;
  readonly deleteBlock: (input: DeleteScheduleBlockInput) => Promise<void>;
  readonly isCreating: boolean;
  readonly isDeleting: boolean;
}

export const useScheduleBlockMutations = (): ScheduleBlockMutationsResult => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (input: CreateScheduleBlockInput): Promise<string> => {
      const blocksCollection = collection(
        firestore,
        "businesses",
        input.businessId,
        "scheduleBlocks",
      );

      const documentReference = await addDoc(blocksCollection, {
        businessId: input.businessId,
        collaboratorId: input.collaboratorId ?? null,
        createdAt: Timestamp.now(),
        endsAt: Timestamp.fromDate(input.endsAt),
        isFullDay: input.isFullDay,
        reason: input.reason ?? null,
        startsAt: Timestamp.fromDate(input.startsAt),
        updatedAt: Timestamp.now(),
      });

      return documentReference.id;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.blocks(variables.businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      blockId,
      businessId,
    }: DeleteScheduleBlockInput): Promise<void> => {
      const blockReference = doc(
        firestore,
        "businesses",
        businessId,
        "scheduleBlocks",
        blockId,
      );
      await deleteDoc(blockReference);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.blocks(variables.businessId),
      });
      void queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
    },
  });

  return {
    createBlock: createMutation.mutateAsync,
    deleteBlock: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
