import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Drawer } from "../Drawer";

const TEXT_PANEL_HIDDEN = "Panel oculto";
const TEXT_PANEL_VISIBLE = "Panel visible";

describe("Drawer", () => {
  it("does not render when isOpen is false", () => {
    render(
      <Drawer isOpen={false}>
        <p>{TEXT_PANEL_HIDDEN}</p>
      </Drawer>,
    );

    expect(screen.queryByText(TEXT_PANEL_HIDDEN)).not.toBeInTheDocument();
  });

  it("renders when isOpen is true and triggers onClose upon backdrop click", () => {
    const handleClose = vi.fn();
    render(
      <Drawer isOpen={true} onClose={handleClose}>
        <p>{TEXT_PANEL_VISIBLE}</p>
      </Drawer>,
    );

    expect(screen.getByText(TEXT_PANEL_VISIBLE)).toBeInTheDocument();

    const backdrop = screen.getByTestId("drawer-backdrop");
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
