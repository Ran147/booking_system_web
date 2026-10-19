import { BUSINESS_STATUS } from "@/domain";
import { BusinessPublicProfileDocumentSchema } from "../api/BusinessPublicProfileDocument.schema";
import { BusinessProfileFormSchema } from "../schemas/BusinessProfileForm.schema";

const validFormValues = {
  contactEmail: "",
  contactPhone: "",
  description: "",
  facebookUrl: "",
  instagramUrl: "",
  name: "Business",
  tiktokUrl: "",
  websiteUrl: "",
  whatsappUrl: "",
};

describe("business profile schemas", () => {
  it("KAN-199: accepts and normalizes a phone allowed by the shared rules", () => {
    const parsedValues = BusinessProfileFormSchema.parse({
      ...validFormValues,
      contactPhone: " +506 2222-2222 ",
    });

    expect(parsedValues).toEqual({
      ...validFormValues,
      contactPhone: "+506 2222-2222",
    });
  });

  it.each([
    ["a phone without digits", "-------"],
    ["a phone with fewer than seven digits", "123-456"],
    ["a phone with more than fifteen digits", "1234567890123456"],
    ["a plus sign after the first character", "506+2222-2222"],
  ])("KAN-199: rejects %s according to the shared rules", (_case, phone) => {
    const result = BusinessProfileFormSchema.safeParse({
      ...validFormValues,
      contactPhone: phone,
    });

    expect(result.success).toBe(false);
  });

  it.each([
    ["an empty phone", ""],
    ["a phone with only spaces", "   "],
  ])("KAN-199: keeps the phone optional for %s", (_case, contactPhone) => {
    const parsedValues = BusinessProfileFormSchema.parse({
      ...validFormValues,
      contactPhone,
    });

    expect(parsedValues).toEqual(validFormValues);
  });

  it("KAN-199: remains compatible with existing documents without optional profile fields", () => {
    const parsedProfile = BusinessPublicProfileDocumentSchema.parse({
      name: "Existing business",
      slug: "existing-business",
      status: BUSINESS_STATUS.ACTIVE,
    });

    expect(parsedProfile).toEqual(
      expect.objectContaining({
        contactEmail: null,
        contactPhone: null,
        description: null,
        logoUrl: null,
        socialLinks: [],
      }),
    );
  });

  it("KAN-199: rejects an unsupported logo format", () => {
    const logoFile = new File(["logo"], "logo.svg", {
      type: "image/svg+xml",
    });
    const logoFiles = {
      0: logoFile,
      item: () => logoFile,
      length: 1,
    } as unknown as FileList;

    const result = BusinessProfileFormSchema.safeParse({
      ...validFormValues,
      logoFile: logoFiles,
    });

    expect(result.success).toBe(false);
  });
});
