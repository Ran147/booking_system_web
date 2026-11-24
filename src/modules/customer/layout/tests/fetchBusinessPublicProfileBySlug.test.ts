import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { FIRESTORE_COLLECTION, FIRESTORE_OPERATOR } from "@/constants";
import { BUSINESS_STATUS, SOCIAL_NETWORK } from "@/domain";
import { fetchBusinessPublicProfileBySlug } from "../api/fetchBusinessPublicProfileBySlug";
import {
  CUSTOMER_BUSINESS_FIELD,
  CUSTOMER_BUSINESS_QUERY,
} from "../constants/CustomerBusiness.constants";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "business-collection"),
  getDocs: vi.fn(),
  limit: vi.fn(() => "single-result-limit"),
  query: vi.fn(() => "business-query"),
  where: vi.fn(() => "slug-filter"),
}));

vi.mock("@/services", () => ({ firestore: "firestore" }));

const DOCUMENT_DATA = {
  contactEmail: "contacto@negocio.test",
  contactPhone: "+506 2222-3333",
  description: "Perfil público",
  logoUrl: "https://example.test/logo.webp",
  name: "Negocio",
  slug: "negocio",
  socialLinks: [
    {
      network: SOCIAL_NETWORK.INSTAGRAM,
      url: "https://instagram.com/negocio",
    },
  ],
  status: BUSINESS_STATUS.ACTIVE,
};

const createDocumentSnapshot = (id: string, value: unknown): object =>
  Object.defineProperty({ id }, "data", { value: (): unknown => value });

describe("fetchBusinessPublicProfileBySlug", () => {
  it("KAN-117: queries one business by slug and validates its public profile", async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [createDocumentSnapshot("business-id", DOCUMENT_DATA)],
    } as never);

    await expect(fetchBusinessPublicProfileBySlug("negocio")).resolves.toEqual({
      id: "business-id",
      ...DOCUMENT_DATA,
    });
    expect(collection).toHaveBeenCalledWith(
      "firestore",
      FIRESTORE_COLLECTION.BUSINESSES,
    );
    expect(where).toHaveBeenCalledWith(
      CUSTOMER_BUSINESS_FIELD.SLUG,
      FIRESTORE_OPERATOR.EQUAL,
      "negocio",
    );
    expect(limit).toHaveBeenCalledWith(CUSTOMER_BUSINESS_QUERY.RESULT_LIMIT);
    expect(query).toHaveBeenCalledWith(
      "business-collection",
      "slug-filter",
      "single-result-limit",
    );
  });

  it("KAN-117: returns null when the slug has no business", async () => {
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);

    await expect(
      fetchBusinessPublicProfileBySlug("inexistente"),
    ).resolves.toBeNull();
  });

  it.each([BUSINESS_STATUS.PENDING, BUSINESS_STATUS.REJECTED])(
    "KAN-117: hides a business whose status is %s",
    async (status) => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          createDocumentSnapshot("non-public-business", {
            ...DOCUMENT_DATA,
            status,
          }),
        ],
      } as never);

      await expect(
        fetchBusinessPublicProfileBySlug("negocio"),
      ).resolves.toBeNull();
    },
  );

  it.each([BUSINESS_STATUS.INACTIVE, BUSINESS_STATUS.SUSPENDED])(
    "KAN-117: preserves a public business whose status is %s",
    async (status) => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          createDocumentSnapshot("public-business", {
            ...DOCUMENT_DATA,
            status,
          }),
        ],
      } as never);

      await expect(
        fetchBusinessPublicProfileBySlug("negocio"),
      ).resolves.toEqual(expect.objectContaining({ status }));
    },
  );

  it("KAN-120: preserves valid social links when another link is invalid", async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        createDocumentSnapshot("business-id", {
          ...DOCUMENT_DATA,
          socialLinks: [
            ...DOCUMENT_DATA.socialLinks,
            {
              network: SOCIAL_NETWORK.FACEBOOK,
              url: "http://facebook.com/inseguro",
            },
          ],
        }),
      ],
    } as never);

    await expect(fetchBusinessPublicProfileBySlug("negocio")).resolves.toEqual(
      expect.objectContaining({ socialLinks: DOCUMENT_DATA.socialLinks }),
    );
  });

  it("KAN-117: rejects documents outside the KAN-199 contract", async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [createDocumentSnapshot("invalid", { ...DOCUMENT_DATA, name: "" })],
    } as never);

    await expect(fetchBusinessPublicProfileBySlug("negocio")).rejects.toThrow();
  });
});
