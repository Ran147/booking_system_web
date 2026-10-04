import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextareaField } from "../TextareaField";

const LABEL_NOTES = "Notas Adicionales";
const PLACEHOLDER_NOTES = "Escribe detalles...";
const VALUE_TEST = "Detalles de la cita";

describe("TextareaField", () => {
  it("renders with label, placeholder, and handles input", () => {
    const handleChange = vi.fn();
    render(
      <TextareaField
        label={LABEL_NOTES}
        name="notes"
        onChange={handleChange}
        placeholder={PLACEHOLDER_NOTES}
      />,
    );

    const textarea = screen.getByLabelText(LABEL_NOTES);
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: VALUE_TEST } });
    expect(handleChange).toHaveBeenCalled();
  });
});
