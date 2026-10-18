import { updateDoc } from "firebase/firestore";
import { deleteObject } from "firebase/storage";
import { saveBusinessPublicProfile } from "../api/saveBusinessPublicProfile";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
}));
vi.mock("firebase/storage", () => ({
  deleteObject: vi.fn(),
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));
vi.mock("@/services", () => ({ firestore: {}, storage: {} }));

describe("saveBusinessPublicProfile", () => {
  it("KAN-199: reports an error when removing the logo from Storage fails", async () => {
    vi.mocked(updateDoc).mockResolvedValue();
    vi.mocked(deleteObject).mockRejectedValue(new Error("storage-unavailable"));

    await expect(
      saveBusinessPublicProfile({
        businessId: "business-test",
        logoFile: null,
        removeLogo: true,
        values: {
          contactEmail: null,
          contactPhone: null,
          description: null,
          logoUrl: "https://example.com/logo.png",
          name: "Business",
          socialLinks: [],
        },
      }),
    ).rejects.toThrow("storage-unavailable");
  });
});
