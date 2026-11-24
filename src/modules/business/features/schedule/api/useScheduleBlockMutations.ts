import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
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

interface CreateBlockResponse {
  readonly blockId: string;
}

interface DeleteBlockResponse {
  readonly blockId: string;
  readonly success: boolean;
}

export const useScheduleBlockMutations = (): ScheduleBlockMutationsResult => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (input: CreateScheduleBlockInput): Promise<string> => {
      const response = await callFunction<
        {
          readonly businessId: string;
          readonly collaboratorId?: Nullable<string>;
          readonly endsAt: string;
          readonly isFullDay: boolean;
          readonly reason?: Nullable<string>;
          readonly startsAt: string;
        },
        CreateBlockResponse
      >(FUNCTION_NAME.CREATE_SCHEDULE_BLOCK, {
        businessId: input.businessId,
        collaboratorId: input.collaboratorId ?? null,
        endsAt: input.endsAt.toISOString(),
        isFullDay: input.isFullDay,
        reason: input.reason ?? null,
        startsAt: input.startsAt.toISOString(),
      });

      return response.blockId;
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
      await callFunction<DeleteScheduleBlockInput, DeleteBlockResponse>(
        FUNCTION_NAME.DELETE_SCHEDULE_BLOCK,
        {
          blockId,
          businessId,
        },
      );
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
