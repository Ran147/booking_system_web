import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/common";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { CUSTOMER_SESSION, renderWithProviders } from "@/shared/test-utils";
import { ProfileEditPage } from "../ProfileEditPage";
import * as fetchProfileModule from "../api/fetchCustomerProfile";
import * as updateProfileModule from "../api/updateCustomerProfile";

const PROFILE = {
  email: "ana.rodriguez@example.com",
  fullName: "Ana Rodríguez",
  phone: "+506 8888-8888",
};

const renderPage = (): void => {
  renderWithProviders(<ProfileEditPage />, {
    initialPath: "/demo/profile",
    session: CUSTOMER_SESSION,
  });
};

describe("ProfileEditPage (KAN-170)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(fetchProfileModule, "fetchCustomerProfile").mockResolvedValue(
      PROFILE,
    );
  });

  it("preloads personal data, keeps email read-only and disables unchanged save", async () => {
    renderPage();

    expect(
      await screen.findByDisplayValue(PROFILE.fullName),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(PROFILE.phone)).toBeInTheDocument();
    expect(screen.getByDisplayValue(PROFILE.email)).toHaveAttribute("readonly");
    expect(
      screen.getByRole("button", { name: /guardar cambios/i }),
    ).toBeDisabled();
  });

  it("saves valid changes and resets the dirty state", async () => {
    const user = userEvent.setup();
    const updateSpy = vi
      .spyOn(updateProfileModule, "updateCustomerProfile")
      .mockResolvedValue({
        fullName: "Ana María Rodríguez",
        phone: "+506 8888-8888",
      });
    const successSpy = vi.spyOn(toast, "success");
    renderPage();

    const nameInput = await screen.findByDisplayValue(PROFILE.fullName);
    await user.clear(nameInput);
    await user.type(nameInput, "Ana María Rodríguez");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(updateSpy).toHaveBeenCalledOnce());
    expect(updateSpy).toHaveBeenCalledWith({
      formValues: { fullName: "Ana María Rodríguez", phone: PROFILE.phone },
      userId: CUSTOMER_SESSION.userId,
    });
    expect(successSpy).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /guardar cambios/i }),
    ).toBeDisabled();
  });

  it("validates required and malformed values before saving", async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(updateProfileModule, "updateCustomerProfile");
    renderPage();

    const nameInput = await screen.findByDisplayValue(PROFILE.fullName);
    const phoneInput = screen.getByDisplayValue(PROFILE.phone);
    await user.clear(nameInput);
    await user.clear(phoneInput);
    await user.type(phoneInput, "abc");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(
      await screen.findByText("Este campo es obligatorio."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/teléfono válido con 7 a 15 dígitos/i),
    ).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("keeps edited values and reports a persistence error", async () => {
    const user = userEvent.setup();
    vi.spyOn(updateProfileModule, "updateCustomerProfile").mockRejectedValue(
      new FirebaseError(FIREBASE_ERROR_CODE.UNAVAILABLE, "Unavailable"),
    );
    const errorSpy = vi.spyOn(toast, "error");
    renderPage();

    const phoneInput = await screen.findByDisplayValue(PROFILE.phone);
    await user.clear(phoneInput);
    await user.type(phoneInput, "+506 7777-7777");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(phoneInput).toHaveValue("+506 7777-7777");
  });

  it("asks for confirmation when cancelling with unsaved changes", async () => {
    const user = userEvent.setup();
    renderPage();

    const nameInput = await screen.findByDisplayValue(PROFILE.fullName);
    await user.type(nameInput, " Editado");
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/cambios sin guardar/i)).toBeInTheDocument();
  });
});
