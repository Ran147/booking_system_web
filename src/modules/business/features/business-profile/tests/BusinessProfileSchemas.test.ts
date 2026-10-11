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
