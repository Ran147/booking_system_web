import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecaptchaField } from "../RecaptchaField";
import type { RecaptchaRenderParameters } from "../models/recaptchaField.model";

const LABEL = "Verificación de seguridad";
const SITE_KEY = "site-key-test";
const WIDGET_ID = 7;
const TOKEN = "recaptcha-token";

// The script is loaded once per page, so every test shares this fake API.
const googleApi = {
  render: vi.fn(
    (_container: HTMLElement, _parameters: RecaptchaRenderParameters) =>
      WIDGET_ID,
  ),
  reset: vi.fn(),
};

const renderRecaptchaField = (
  resetSignal: number,
  handleTokenChange = vi.fn(),
): ReturnType<typeof render> =>
  render(
    <RecaptchaField
      label={LABEL}
      language="es"
      onTokenChange={handleTokenChange}
      resetSignal={resetSignal}
      siteKey={SITE_KEY}
    />,
  );

describe("RecaptchaField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads Google's script, renders the widget and reports the token", async () => {
    const handleTokenChange = vi.fn();
    renderRecaptchaField(0, handleTokenChange);
    const scriptSource = document.head
      .querySelector("script[src*='recaptcha/api.js']")
      ?.getAttribute("src");
    expect(scriptSource).toContain("hl=es");
    expect(scriptSource).toContain("render=explicit");

    window.grecaptcha = googleApi;
    act(() => window.onRecaptchaLoad?.());

    await waitFor(() => expect(googleApi.render).toHaveBeenCalledTimes(1));
    const [, renderParameters] = googleApi.render.mock.lastCall ?? [];
    expect(renderParameters?.sitekey).toBe(SITE_KEY);
    expect(screen.getByRole("group", { name: LABEL })).toBeInTheDocument();

    act(() => renderParameters?.callback(TOKEN));
    expect(handleTokenChange).toHaveBeenLastCalledWith(TOKEN);

    act(() => renderParameters?.["expired-callback"]());
    expect(handleTokenChange).toHaveBeenLastCalledWith(null);
  });

  it("resets the widget when the reset signal changes", async () => {
    const { rerender } = renderRecaptchaField(0);
    await waitFor(() => expect(googleApi.render).toHaveBeenCalled());

    rerender(
      <RecaptchaField
        label={LABEL}
        language="es"
        onTokenChange={vi.fn()}
        resetSignal={1}
        siteKey={SITE_KEY}
      />,
    );

    expect(googleApi.reset).toHaveBeenCalledWith(WIDGET_ID);
  });
});
