import { FirebaseError } from "firebase/app";
import { ERROR_MESSAGE_KEY, FIREBASE_ERROR_CODE } from "@/constants";
import { CUSTOMER_SESSION, renderWithProviders, testI18n } from "@/test-utils";
import { createCustomerProfilePage } from "./CustomerProfilePage.page";
import { fetchCustomerPersonalProfile } from "../api/fetchCustomerPersonalProfile";
import { CustomerProfilePage } from "../pages/CustomerProfilePage";

vi.mock("../api/fetchCustomerPersonalProfile");

const profile = {
  email: "firestore@demo.test",
  fullName: "Customer Name",
  phone: "+506 8888-0000",
};

beforeEach(() => {
  vi.mocked(fetchCustomerPersonalProfile)
    .mockReset()
    .mockResolvedValue(profile);
});

describe("KAN-169 profile page", () => {
  it("KAN-169 AC-01 AC-11: shows only the three read-only definitions with keyboard return", async () => {
    renderWithProviders(<CustomerProfilePage />, { session: CUSTOMER_SESSION });
    const page = createCustomerProfilePage();
    await page.findValue(profile.fullName);
    expect(
      page.getDefinitions().map((definition) => definition.textContent),
    ).toEqual([profile.fullName, profile.email, profile.phone]);
    expect(page.queryValue("customer-test")).not.toBeInTheDocument();
    await page.tab();
    expect(page.getReturn()).toHaveFocus();
  });

  it("KAN-169 AC-02: displays per-field unavailable values without a missing-document state", async () => {
    vi.mocked(fetchCustomerPersonalProfile).mockResolvedValue({
      email: null,
      fullName: null,
      phone: null,
    });
    renderWithProviders(<CustomerProfilePage />, { session: CUSTOMER_SESSION });
    const page = createCustomerProfilePage();
    await page.findValue(testI18n.t("customer:profile.fields.fullName"));
    // Wait for the three definitions, rather than relying on the page's synchronous heading.
    await page.findValue(testI18n.t("customer:profile.fields.email"));
    expect(page.getDefinitions()).toHaveLength(3);
    for (const definition of page.getDefinitions())
      expect(definition).toHaveTextContent(
        testI18n.t("customer:profile.fields.notProvided"),
      );
  });

  it("KAN-169 AC-03 AC-11: keeps loading accessible and return usable without values", () => {
    vi.mocked(fetchCustomerPersonalProfile).mockReturnValue(
      new Promise(() => undefined),
    );
    renderWithProviders(<CustomerProfilePage />, { session: CUSTOMER_SESSION });
    const page = createCustomerProfilePage();
    expect(page.getLoading()).toBeInTheDocument();
    expect(page.getReturn()).toBeInTheDocument();
    expect(page.queryValue(profile.email)).not.toBeInTheDocument();
  });

  it.each([
    [
      FIREBASE_ERROR_CODE.PERMISSION_DENIED,
      ERROR_MESSAGE_KEY.PERMISSION_DENIED,
    ],
    [FIREBASE_ERROR_CODE.UNAVAILABLE, ERROR_MESSAGE_KEY.NETWORK],
    [FIREBASE_ERROR_CODE.UNKNOWN, ERROR_MESSAGE_KEY.UNKNOWN],
  ])(
    "KAN-169 AC-04 AC-11: maps %s safely and recovers on retry",
    async (code, messageKey) => {
      vi.mocked(fetchCustomerPersonalProfile).mockRejectedValueOnce(
        new FirebaseError(code, "private raw exception"),
      );
      renderWithProviders(<CustomerProfilePage />, {
        session: CUSTOMER_SESSION,
      });
      const page = createCustomerProfilePage();
      const alert = await page.findAlert();
      expect(alert).toHaveTextContent(testI18n.t(messageKey));
      expect(alert).not.toHaveTextContent("private raw exception");
      await page.clickRetry();
      expect(await page.findValue(profile.email)).toBeInTheDocument();
      expect(fetchCustomerPersonalProfile).toHaveBeenCalledTimes(2);
    },
  );

  it("KAN-169 AC-05 AC-11: announces a nonexistent document without fabricating fields", async () => {
    vi.mocked(fetchCustomerPersonalProfile).mockResolvedValue(null);
    renderWithProviders(<CustomerProfilePage />, { session: CUSTOMER_SESSION });
    const page = createCustomerProfilePage();
    await page.findValue(testI18n.t("customer:profile.states.notFound"));
    expect(page.getMissing()).toBeInTheDocument();
    expect(page.getReturn()).toBeInTheDocument();
  });
});
