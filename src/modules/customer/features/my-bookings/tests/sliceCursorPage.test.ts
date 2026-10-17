import { describe, expect, it } from "vitest";
import { sliceCursorPage } from "../api/sliceCursorPage";

describe("sliceCursorPage", () => {
  it("has a next page when the extra document arrives, and drops it", () => {
    const result = sliceCursorPage([1, 2, 3, 4], 3);

    expect(result).toEqual({ hasMorePages: true, pageDocuments: [1, 2, 3] });
  });

  it("has no next page when the last page is exactly full", () => {
    const result = sliceCursorPage([1, 2, 3], 3);

    expect(result).toEqual({ hasMorePages: false, pageDocuments: [1, 2, 3] });
  });

  it("has no next page when the last page is not full", () => {
    expect(sliceCursorPage([1, 2], 3)).toEqual({
      hasMorePages: false,
      pageDocuments: [1, 2],
    });
    expect(sliceCursorPage([], 3)).toEqual({
      hasMorePages: false,
      pageDocuments: [],
    });
  });
});
