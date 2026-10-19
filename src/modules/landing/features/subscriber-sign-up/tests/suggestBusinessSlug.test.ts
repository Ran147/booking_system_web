import { suggestBusinessSlug } from "../utils/suggestBusinessSlug";

describe("suggestBusinessSlug", () => {
  it("KAN-25: lowercases, removes accents and joins words with hyphens", () => {
    expect(suggestBusinessSlug("Peluquería Doña Ana")).toBe(
      "peluqueria-dona-ana",
    );
  });

  it("KAN-25: drops symbols and repeated or edge separators", () => {
    expect(suggestBusinessSlug("  Barber & Co.  --  Centro! ")).toBe(
      "barber-co-centro",
    );
  });

  it("KAN-25: never suggests more than 40 characters or a trailing hyphen", () => {
    const suggestedSlug = suggestBusinessSlug(
      "Centro de estética integral y bienestar para toda la familia",
    );

    expect(suggestedSlug.length).toBeLessThanOrEqual(40);
    expect(suggestedSlug.endsWith("-")).toBe(false);
  });
});
