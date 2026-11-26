import { CustomerPersonalProfileDocumentSchema } from "../api/CustomerPersonalProfileDocument.schema";

describe("KAN-169 personal profile projection", () => {
  it("KAN-169 AC-01: trims values and strips every internal field", () => {
    expect(
      CustomerPersonalProfileDocumentSchema.parse({
        businessId: "private-business",
        claims: { role: "subscriber" },
        email: " Firestore@demo.test ",
        fullName: " Customer Name ",
        language: "es",
        phone: " +506 8888-0000 ",
        role: "customer",
        theme: "dark",
        tokens: ["secret"],
      }),
    ).toEqual({
      email: "Firestore@demo.test",
      fullName: "Customer Name",
      phone: "+506 8888-0000",
    });
  });

  it.each([undefined, null, "", " \t\n "])(
    "KAN-169 AC-02: normalizes unavailable values (%s) per field",
    (value) => {
      for (const field of ["email", "fullName", "phone"]) {
        const profile = CustomerPersonalProfileDocumentSchema.parse({
          email: "customer@demo.test",
          fullName: "Customer",
          phone: "+506 8888-0000",
          [field]: value,
        });
        expect(profile).toEqual({
          email: "customer@demo.test",
          fullName: "Customer",
          phone: "+506 8888-0000",
          [field]: null,
        });
      }
    },
  );

  it("KAN-169 AC-02: preserves an existing empty document as a projection", () => {
    expect(CustomerPersonalProfileDocumentSchema.parse({})).toEqual({
      email: null,
      fullName: null,
      phone: null,
    });
  });

  it.each([42, true, [], {}, ["value"]])(
    "KAN-169 AC-04: rejects nonstring personal fields (%s)",
    (value) => {
      for (const field of ["email", "fullName", "phone"]) {
        expect(
          CustomerPersonalProfileDocumentSchema.safeParse({ [field]: value })
            .success,
        ).toBe(false);
      }
    },
  );
});
