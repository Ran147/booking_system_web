import { screen } from "@testing-library/react";
import { ROUTE_PATH } from "@/constants";
import {
  renderWithProviders,
  SUBSCRIBER_SESSION,
  testI18n,
} from "@/test-utils";
import { PasswordSettingsPage } from "../PasswordSettingsPage";

describe("PasswordSettingsPage", () => {
  it("KAN-53: renders the original password form in its dedicated view", () => {
    renderWithProviders(<PasswordSettingsPage />, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS_PASSWORD}`,
      session: SUBSCRIBER_SESSION,
    });

    expect(
      screen.getByLabelText(
        testI18n.t("business:settings.password.currentPasswordLabel"),
        { exact: false, selector: 'input[name="currentPassword"]' },
      ),
    ).toBeInTheDocument();
  });

  it("KAN-53: provides a link back to the settings overview", () => {
    renderWithProviders(<PasswordSettingsPage />, {
      initialPath: `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS_PASSWORD}`,
      session: SUBSCRIBER_SESSION,
    });

    expect(
      screen.getByRole("link", {
        name: testI18n.t("business:settings.password.backAction"),
      }),
    ).toHaveAttribute(
      "href",
      `${ROUTE_PATH.BUSINESS.ROOT}/${ROUTE_PATH.BUSINESS.SETTINGS}`,
    );
  });
});
