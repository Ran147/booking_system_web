import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAvailability } from "../api/fetchAvailability";
import { findFirstAvailableDate } from "../api/findFirstAvailableDate";

vi.mock("../api/fetchAvailability", () => ({ fetchAvailability: vi.fn() }));

const OPEN_DAYS = ["2026-11-20", "2026-11-21", "2026-11-22"];
const PARAMS = {
  businessId: "business-1",
  collaboratorId: null,
  openDays: OPEN_DAYS,
  serviceId: "service-1",
  today: "2026-11-20",
};
const EMPTY_DAY = { date: "", slots: [], timeZone: "America/Costa_Rica" };

describe("findFirstAvailableDate (AC-KAN-140-07)", () => {
  beforeEach(() => {
    vi.mocked(fetchAvailability).mockReset();
  });

  it("AC-KAN-140-07: stops at the first open day with a free slot", async () => {
    vi.mocked(fetchAvailability)
      .mockResolvedValueOnce(EMPTY_DAY)
      .mockResolvedValueOnce({
        ...EMPTY_DAY,
        slots: [{ endsAt: "b", startsAt: "a" }],
      });

    await expect(
      findFirstAvailableDate(PARAMS, new AbortController().signal),
    ).resolves.toBe("2026-11-21");
    expect(fetchAvailability).toHaveBeenCalledTimes(2);
  });

  it("stops asking once the page that needed the answer is gone", async () => {
    const controller = new AbortController();
    vi.mocked(fetchAvailability).mockImplementation(async () => {
      controller.abort();
      return EMPTY_DAY;
    });

    await expect(
      findFirstAvailableDate(PARAMS, controller.signal),
    ).rejects.toThrow();
    expect(fetchAvailability).toHaveBeenCalledTimes(1);
  });
});
