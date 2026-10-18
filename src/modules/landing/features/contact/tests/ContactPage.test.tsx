import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders, SIGNED_OUT_SESSION } from "@/test-utils";
import { testI18n } from "@/test-utils/testI18n";
import { ContactPage } from "../ContactPage";

vi.mock("@/components/common/recaptcha-field", async () => ({
  RecaptchaField: (await import("./recaptchaFieldDouble")).RecaptchaFieldDouble,
}));

describe("ContactPage (US-05 / KAN-5 & US-17 / KAN-17)", () => {
  it("renders page header, direct contact channels and the contact form (AC-KAN-17-02)", () => {
    renderWithProviders(<ContactPage />, {
      initialPath: ROUTE_PATH.LANDING.CONTACT,
      session: SIGNED_OUT_SESSION,
    });

    const expectedTitle = testI18n.t("landing:contact.page.title");
    const expectedDescription = testI18n.t("landing:contact.page.description");
    const expectedChannelsTitle = testI18n.t(
      "landing:contact.channels.cardTitle",
    );

    expect(
      screen.getByRole("heading", { name: expectedTitle, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(expectedDescription)).toBeInTheDocument();

    // Direct channels section
    expect(
      screen.getByRole("heading", { name: expectedChannelsTitle, level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /correo/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /teléfono|llamar/i }),
    ).toBeInTheDocument();

    // Contact form fields
    expect(
      screen.getByRole("textbox", { name: /nombre/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enviar mensaje/i }),
    ).toBeInTheDocument();
  });

  it("AC-KAN-17-04: renders form-only layout when no direct channels are configured", () => {
    renderWithProviders(
      <ContactPage
        configOverride={{
          email: "",
          phone: "",
          socialUrls: {},
        }}
      />,
      {
        initialPath: ROUTE_PATH.LANDING.CONTACT,
        session: SIGNED_OUT_SESSION,
      },
    );

    const expectedChannelsTitle = testI18n.t(
      "landing:contact.channels.cardTitle",
    );

    expect(
      screen.queryByRole("heading", { name: expectedChannelsTitle }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /correo/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /teléfono|llamar/i }),
    ).not.toBeInTheDocument();

    // Contact form is still cleanly rendered
    expect(
      screen.getByRole("textbox", { name: /nombre/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enviar mensaje/i }),
    ).toBeInTheDocument();
  });
});
