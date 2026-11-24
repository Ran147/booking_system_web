import { FirebaseError } from "firebase/app";
import type * as FirebaseFirestore from "firebase/firestore";
import { getDoc } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readBookableService } from "../api/fetchBookingContext";

vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof FirebaseFirestore>()),
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

describe("readBookableService (AC-KAN-140-03)", () => {
  beforeEach(() => {
    vi.mocked(getDoc).mockReset();
  });

  it("AC-KAN-140-03: a service the rules deny (deactivated) cannot be booked instead of failing", async () => {
    vi.mocked(getDoc).mockRejectedValue(
      new FirebaseError(
        "permission-denied",
        "Missing or insufficient permissions.",
      ),
    );

    await expect(
      readBookableService("business-1", "service-off"),
    ).resolves.toBeNull();
  });

  it("AC-KAN-140-02: a network failure still shows the error with retry", async () => {
    const networkError = new FirebaseError("unavailable", "offline");
    vi.mocked(getDoc).mockRejectedValue(networkError);

    await expect(readBookableService("business-1", "service-1")).rejects.toBe(
      networkError,
    );
  });
});
