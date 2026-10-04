import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../Button";
import { BUTTON_VARIANT } from "../constants/button.constants";

const LABEL_SAVE = "Guardar";
const LABEL_DISABLED = "Deshabilitado";
const LABEL_LOADING = "Procesando";
const LABEL_LUXURY = "Plan Premium";

describe("Button", () => {
  it("renders text and handles clicks", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>{LABEL_SAVE}</Button>);

    const button = screen.getByRole("button", { name: LABEL_SAVE });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disables interaction when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        {LABEL_DISABLED}
      </Button>,
    );

    const button = screen.getByRole("button", { name: LABEL_DISABLED });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("shows loading state and disables interaction", () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        {LABEL_LOADING}
      </Button>,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies the luxury variant correctly", () => {
    render(<Button variant={BUTTON_VARIANT.LUXURY}>{LABEL_LUXURY}</Button>);

    const button = screen.getByRole("button", { name: LABEL_LUXURY });
    expect(button).toHaveClass("border-primary/30");
  });
});
