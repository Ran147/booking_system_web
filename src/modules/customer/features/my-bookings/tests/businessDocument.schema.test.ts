import type { DocumentSnapshot } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { mapBookingBusiness } from "../api/businessDocument.schema";

const DOCUMENT_DATA_KEY = "data";

const buildDocument = (
  overrides: Record<string, unknown> = {},
): DocumentSnapshot =>
  ({
    [DOCUMENT_DATA_KEY]: () => ({
      currency: "MXN",
      name: "Barbería Centro",
      slug: "barberia-centro",
      timeZone: "America/Mexico_City",
      ...overrides,
    }),
    id: "business-a",
  }) as unknown as DocumentSnapshot;

describe("mapBookingBusiness (KAN-150)", () => {
  it("reads the public data the lists need", () => {
    expect(mapBookingBusiness(buildDocument())).toEqual({
      currency: "MXN",
      id: "business-a",
      name: "Barbería Centro",
      slug: "barberia-centro",
      timeZone: "America/Mexico_City",
    });
  });

  it("accepts a business created by the real sign-up, which has no currency", () => {
    const business = mapBookingBusiness(buildDocument({ currency: undefined }));

    expect(business.currency).toBeNull();
  });

  it("rejects a business without a time zone", () => {
    expect(() =>
      mapBookingBusiness(buildDocument({ timeZone: undefined })),
    ).toThrow();
  });
});
