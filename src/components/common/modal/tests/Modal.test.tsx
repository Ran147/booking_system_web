import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "../Modal";

const TITLE_TEST = "Test Modal";
const TITLE_CONFIRM = "Confirmación";
const TEXT_HIDDEN = "Contenido oculto";
const TEXT_CONFIRM_QUESTION = "¿Desea continuar?";
const CLOSE_BUTTON_NAME = "Cerrar modal";

describe("Modal", () => {
  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title={TITLE_TEST}>
        <p>{TEXT_HIDDEN}</p>
      </Modal>,
    );

    expect(screen.queryByText(TEXT_HIDDEN)).not.toBeInTheDocument();
  });

  it("renders when isOpen is true and triggers onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title={TITLE_CONFIRM}>
        <p>{TEXT_CONFIRM_QUESTION}</p>
      </Modal>,
    );

    expect(screen.getByText(TITLE_CONFIRM)).toBeInTheDocument();
    expect(screen.getByText(TEXT_CONFIRM_QUESTION)).toBeInTheDocument();

    const closeButton = screen.getByRole("button", {
      name: CLOSE_BUTTON_NAME,
    });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
