import { FirebaseError } from "firebase/app";
import type * as FirebaseFirestore from "firebase/firestore";
import { getDoc, getDocs } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCheckoutSummary } from "../api/fetchCheckoutSummary";

vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof FirebaseFirestore>()),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

const ACTIVE_BUSINESS = {
  docs: [
    {
      ["data"]: (): Record<string, unknown> => ({
        name: "Barbería Centro",
        status: "active",
        timeZone: "America/Costa_Rica",
      }),
      id: "business-1",
    },
  ],
};

describe("fetchCheckoutSummary (AC-KAN-146-04)", () => {
  beforeEach(() => {
    vi.mocked(getDocs).mockResolvedValue(
      ACTIVE_BUSINESS as unknown as Awaited<ReturnType<typeof getDocs>>,
    );
  });

  it("AC-KAN-146-04: a deactivated service, which the rules deny, shows not found instead of an error", async () => {
    vi.mocked(getDoc).mockRejectedValue(
      new FirebaseError(
        "permission-denied",
        "Missing or insufficient permissions.",
      ),
    );

    await expect(
      fetchCheckoutSummary("barberia-centro", "service-off", new Date()),
    ).resolves.toBeNull();
  });
});
