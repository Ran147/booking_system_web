import { waitFor } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { CUSTOMER_SESSION } from "@/test-utils/sessionFixtures";
import { ProfilePage } from "../ProfilePage";
import { createProfilePage } from "./ProfilePage.page";
import { fetchCustomerProfile } from "../api/fetchCustomerProfile";

vi.mock("../api/fetchCustomerProfile");

const PROFILE_PATH = "/barberia-centro/profile";

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.mocked(fetchCustomerProfile).mockReset();
  });

  it("KAN-169 AC-KAN-169-01: shows the signed-in customer's stored personal data", async () => {
    const customerProfile = {
      email: "customer@example.com",
      fullName: "Ana Morales",
      phone: "+506 8888-7777",
    };
    vi.mocked(fetchCustomerProfile).mockResolvedValue(customerProfile);

    renderWithProviders(<ProfilePage />, {
      initialPath: PROFILE_PATH,
      session: CUSTOMER_SESSION,
    });
    const profilePage = createProfilePage();

    expect(profilePage.getLoadingStatus()).toBeInTheDocument();
    expect(
      await profilePage.findProfileValue(customerProfile.fullName),
    ).toBeInTheDocument();
    expect(fetchCustomerProfile).toHaveBeenCalledWith(CUSTOMER_SESSION.userId);
  });

  it("KAN-169 AC-KAN-169-02: shows a hint for personal data that was not provided", async () => {
    vi.mocked(fetchCustomerProfile).mockResolvedValue({
      email: "customer@example.com",
      fullName: "Ana Morales",
      phone: null,
    });

    renderWithProviders(<ProfilePage />, {
      initialPath: PROFILE_PATH,
      session: CUSTOMER_SESSION,
    });
    const profilePage = createProfilePage();

    expect(await profilePage.findNotProvidedHints()).toHaveLength(1);
  });

  it("KAN-169 AC-KAN-169-03: shows a network error and retries loading the profile", async () => {
    vi.mocked(fetchCustomerProfile)
      .mockRejectedValueOnce(
        new FirebaseError(FIREBASE_ERROR_CODE.UNAVAILABLE, "Unavailable"),
      )
      .mockResolvedValueOnce({
        email: "customer@example.com",
        fullName: "Ana Morales",
        phone: "+506 8888-7777",
      });

    renderWithProviders(<ProfilePage />, {
      initialPath: PROFILE_PATH,
      session: CUSTOMER_SESSION,
    });
    const profilePage = createProfilePage();

    expect(await profilePage.findErrorMessage()).toBeInTheDocument();
    await profilePage.clickRetry();
    expect(
      await profilePage.findProfileValue("Ana Morales"),
    ).toBeInTheDocument();
    expect(fetchCustomerProfile).toHaveBeenCalledTimes(2);
  });

  it("KAN-169: shows an empty state when the account has no profile document", async () => {
    vi.mocked(fetchCustomerProfile).mockResolvedValue(null);

    renderWithProviders(<ProfilePage />, {
      initialPath: PROFILE_PATH,
      session: CUSTOMER_SESSION,
    });
    const profilePage = createProfilePage();

    expect(await profilePage.findEmptyMessage()).toBeInTheDocument();
    await waitFor(() => expect(fetchCustomerProfile).toHaveBeenCalledOnce());
  });
});
