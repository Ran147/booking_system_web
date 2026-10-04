import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InputField } from "../InputField";

const LABEL_EMAIL = "Correo Electrónico";
const PLACEHOLDER_EMAIL = "ejemplo@correo.com";
const LABEL_FIRST_NAME = "Nombre";
const ERROR_REQUIRED = "El campo es requerido";

describe("InputField", () => {
  it("renders with label and accepts typing", () => {
    const handleChange = vi.fn();
    render(
      <InputField
        label={LABEL_EMAIL}
        name="email"
        onChange={handleChange}
        placeholder={PLACEHOLDER_EMAIL}
      />,
    );

    const input = screen.getByLabelText(LABEL_EMAIL);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "test@domain.com" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("renders error state with accessible aria attributes", () => {
    render(
      <InputField
        error={ERROR_REQUIRED}
        label={LABEL_FIRST_NAME}
        name="firstName"
      />,
    );

    const input = screen.getByLabelText(LABEL_FIRST_NAME);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(ERROR_REQUIRED)).toBeInTheDocument();
  });
});
