import { useState } from "react";
import type { PageCursor } from "@/shared/types";
import type { UseCursorPaginationReturn } from "./UseCursorPaginationReturn.interface";

export const useCursorPagination = (
  resetKeys: readonly unknown[],
): UseCursorPaginationReturn => {
  const resetSignature = JSON.stringify(resetKeys);
  const [cursorStack, setCursorStack] = useState<PageCursor[]>([]);
  const [previousResetSignature, setPreviousResetSignature] =
    useState(resetSignature);

  if (previousResetSignature !== resetSignature) {
    setPreviousResetSignature(resetSignature);
    setCursorStack([]);
  }

  return {
    currentCursor: cursorStack.at(-1) ?? null,
    goToNextPage: (nextCursor: PageCursor): void => {
      setCursorStack((currentStack) => [...currentStack, nextCursor]);
    },
    goToPreviousPage: (): void => {
      setCursorStack((currentStack) => currentStack.slice(0, -1));
    },
    hasPreviousPage: cursorStack.length > 0,
    pageNumber: cursorStack.length + 1,
  };
};
