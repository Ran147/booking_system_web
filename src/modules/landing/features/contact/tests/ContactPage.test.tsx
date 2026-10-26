import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/test-utils";
import { testI18n } from "@/test-utils/testI18n";
import { ContactPage } from "../ContactPage";

vi.mock("@/components/common/recaptcha-field", async () => ({
  RecaptchaField: (await import("./recaptchaFieldDouble")).RecaptchaFieldDouble,
}));

describe("ContactPage (US-05 / KAN-5)", () => {
  it("renders page header and the contact form", () => {
    renderWithProviders(<ContactPage />, {
      initialPath: ROUTE_PATH.LANDING.CONTACT,
      session: SIGNED_OUT_SESSION,
    });

    const expectedTitle = testI18n.t("landing:contact.page.title");
    const expectedDescription = testI18n.t("landing:contact.page.description");

    expect(
      screen.getByRole("heading", { name: expectedTitle, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(expectedDescription)).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /nombre/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enviar mensaje/i }),
    ).toBeInTheDocument();
  });
});
