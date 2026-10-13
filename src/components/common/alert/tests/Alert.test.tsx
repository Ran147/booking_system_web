import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "../Alert";
import { ALERT_VARIANT } from "../constants/alert.constants";

const MESSAGE = "Correo o contraseña incorrectos.";

describe("Alert", () => {
  it("announces its message to screen readers", () => {
    render(<Alert>{MESSAGE}</Alert>);

    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGE);
  });

  it("can receive focus without joining the tab order", () => {
    render(<Alert>{MESSAGE}</Alert>);
    const alert = screen.getByRole("alert");

    alert.focus();

    expect(alert).toHaveFocus();
    expect(alert).toHaveAttribute("tabindex", "-1");
  });

  it("uses the destructive tokens by default and the warning tokens on demand", () => {
    const { rerender } = render(<Alert>{MESSAGE}</Alert>);
    expect(screen.getByRole("alert")).toHaveClass("text-destructive");

    rerender(<Alert variant={ALERT_VARIANT.WARNING}>{MESSAGE}</Alert>);
    expect(screen.getByRole("alert")).toHaveClass("bg-warning/10");
  });
});
